import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAdminDb } from "@/firebase/server";
import { doc, setDoc, getDoc, collection, query, where, getDocs, increment } from "firebase/firestore";
import { fulfillDataBundlePayment } from "@/actions/monnify";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Monnify Webhook Handler Endpoint
 * Automatically processes payment callbacks and updates user wallet or fulfills VAS orders in real-time upon settlement.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const secretKey = (process.env.MONNIFY_SECRET_KEY || process.env.NEXT_PUBLIC_MONNIFY_SECRET_KEY || "").trim();

    // Verify Monnify HMAC SHA512 signature if secret key is present
    const incomingSignature = req.headers.get("monnify-signature");
    if (secretKey && incomingSignature) {
      const computedHash = crypto
        .createHmac("sha512", secretKey)
        .update(rawBody)
        .digest("hex");

      if (computedHash.toLowerCase() !== incomingSignature.toLowerCase()) {
        console.warn("Monnify Webhook: Invalid HMAC Signature mismatch.");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { eventType, eventData } = payload;
    console.log(`Monnify Webhook Received: [${eventType}]`, eventData?.paymentReference || eventData?.reference);

    // Handle successful transaction payments
    if (eventType === "SUCCESSFUL_TRANSACTION") {
      const paymentReference = eventData?.paymentReference || eventData?.reference;
      const transactionReference = eventData?.transactionReference || paymentReference;
      const amount = Number(eventData?.amountPaid || eventData?.amount || 0);
      const customerEmail = (eventData?.customer?.email || eventData?.customerEmail || "").trim().toLowerCase();
      const productRef = eventData?.product?.reference || "";
      const paymentMethod = eventData?.paymentMethod || "Monnify";

      if (paymentReference && amount > 0) {
        console.log(`Monnify Webhook: Confirmed payment ${paymentReference} of NGN ${amount} for ${customerEmail}`);
        
        // 1. Direct Data Bundle / VAS Fulfillment
        const isDataBundlePayment = paymentReference.startsWith("BUNDLE-") ||
          paymentReference.startsWith("DATA-") ||
          paymentReference.startsWith("VAS-") ||
          eventData?.metadata?.serviceType === "DATA_BUNDLE" ||
          (eventData?.paymentDescription || "").toLowerCase().includes("data bundle");

        if (isDataBundlePayment) {
          console.log(`Monnify Webhook: Auto-fulfilling data service payment (${paymentReference})...`);
          try {
            const fulfillmentResult = await fulfillDataBundlePayment({
              paymentReference,
              transactionReference,
              network: eventData?.metadata?.network,
              productCode: eventData?.metadata?.productCode,
              productName: eventData?.metadata?.productName,
              customerPhone: eventData?.metadata?.recipientPhone || eventData?.metadata?.customerPhone || eventData?.customer?.phoneNumber,
              customerEmail,
              amount,
              userId: eventData?.metadata?.userId || undefined
            });
            console.log(`Monnify Webhook: Data bundle fulfillment result:`, fulfillmentResult?.success ? 'SUCCESS' : fulfillmentResult?.error);
          } catch (fErr) {
            console.error("Monnify Webhook: Data fulfillment failed:", fErr);
          }
          return NextResponse.json({ responseCode: "0", responseMessage: "DATA_FULFILLED" }, { status: 200 });
        }

        try {
          const db = getAdminDb();
          let targetUserId: string | null = null;

          // 1. Check if product reference matches dedicated reserved account pattern V-ACC-{userId}
          if (productRef && productRef.startsWith("V-ACC-")) {
            targetUserId = productRef.replace("V-ACC-", "");
          }

          // 2. Fallback: Search for user by email
          if (!targetUserId && customerEmail && db) {
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("email", "==", customerEmail));
            const snap = await getDocs(q);
            if (!snap.empty) {
              targetUserId = snap.docs[0].id;
            }
          }

          // 3. Queue Funding Request for Admin Approval (Auto-credit is strictly disabled)
          if (targetUserId && db) {
            const txColRef = collection(db, "users", targetUserId, "wallet", "default", "transactions");

            // Check if transaction already logged
            const txQuery = query(txColRef, where("reference", "==", paymentReference));
            const existingTxSnap = await getDocs(txQuery);

            const requestId = paymentReference.replace(/[^a-zA-Z0-9_-]/g, '_');
            const fundingDocRef = doc(db, "fundingRequests", requestId);

            // Record in global fundingRequests for Admin Approval Hub
            await setDoc(fundingDocRef, {
              id: requestId,
              userId: targetUserId,
              userEmail: customerEmail,
              amount: amount,
              amountPaid: Number(eventData?.amountPaid || amount),
              settlementAmount: Number(eventData?.settlementAmount || eventData?.amountPaid || amount),
              reference: paymentReference,
              gatewayId: transactionReference,
              paymentMethod: paymentMethod,
              contractCode: eventData?.contractCode || '730430763017',
              status: "Pending Approval",
              gatewayStatus: "PAID",
              gatewayVerified: true,
              paidOn: eventData?.paidOn || new Date().toISOString(),
              createdAt: new Date().toISOString(),
              source: "Monnify Webhook"
            }, { merge: true });

            if (existingTxSnap.empty) {
              // Record pending transaction entry in user ledger (NO balance increment until Admin approval)
              const newTxDocRef = doc(txColRef);
              await setDoc(newTxDocRef, {
                type: "Deposit",
                amount: amount,
                description: `Wallet Funding: ${paymentMethod} (${paymentReference}) - Awaiting Admin Approval`,
                transactionDate: eventData?.paidOn || new Date().toISOString(),
                status: "Pending Approval",
                reference: paymentReference,
                gatewayId: transactionReference,
                paymentMethod: paymentMethod,
                contractCode: eventData?.contractCode || '730430763017',
                source: "Monnify Webhook",
                gatewayVerified: true,
                submittedAt: new Date().toISOString()
              });

              console.log(`Monnify Webhook: Queued ₦${amount} deposit (${paymentReference}) for Admin approval (User: ${targetUserId}). Auto-credit disabled.`);
            } else {
              console.log(`Monnify Webhook: Transaction ${paymentReference} already recorded in user ledger. Updated queue status.`);
            }
          }
        } catch (dbErr) {
          console.error("Monnify Webhook: Firestore crediting error:", dbErr);
        }
      }
    }

    return NextResponse.json({ responseCode: "0", responseMessage: "SUCCESS" }, { status: 200 });
  } catch (error: any) {
    console.error("Monnify Webhook Handler Error:", error);
    return NextResponse.json({ responseCode: "99", responseMessage: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "Monnify Webhook Listener Active", timestamp: new Date().toISOString() });
}
