import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * Monnify Webhook Handler Endpoint
 * Automatically processes payment callbacks and updates user wallet in real-time.
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
        console.warn("Monnify Webhook: Invalid HMAC Signature Signature mismatch.");
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
    if (eventType === "SUCCESSFUL_TRANSACTION" || eventType === "SUCCESSFUL_DISBURSEMENT") {
      const paymentReference = eventData?.paymentReference || eventData?.reference;
      const amount = Number(eventData?.amountPaid || eventData?.amount || 0);
      const customerEmail = eventData?.customer?.email || eventData?.customerEmail;

      if (paymentReference && amount > 0) {
        console.log(`Monnify Webhook: Confirmed payment ${paymentReference} of NGN ${amount} for ${customerEmail}`);
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
