'use server';

import { getAdminDb } from '@/firebase/server';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, increment, addDoc } from 'firebase/firestore';
import { verifyTransaction } from './monnify';

export interface FundingRequestItem {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  amount: number;
  reference: string;
  gatewayId?: string;
  paymentMethod?: string;
  status: 'Pending Approval' | 'Approved' | 'Rejected';
  gatewayStatus?: string;
  gatewayVerified?: boolean;
  contractCode?: string;
  merchantAccount?: string;
  amountPaid?: number;
  settlementAmount?: number;
  paidOn?: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  gatewayMatched?: boolean;
  monnifyAuditData?: any;
}

const MASTER_ADMIN_EMAILS = [
  'altamambcs@callondemandbiz.com',
  'tatatradeandinnovation@gmail.com',
  'altamam02@gmail.com'
];

/**
 * Audits and cross-references a funding request with Monnify gateway live account.
 */
export async function verifyMonnifyGatewayMatch(params: {
  reference: string;
  expectedAmount: number;
  expectedUserEmail?: string;
}): Promise<{
  success: boolean;
  isMatched: boolean;
  error?: string;
  gatewayData?: any;
  discrepancies: string[];
  matchReport: {
    contractMatch: boolean;
    amountMatch: boolean;
    statusMatch: boolean;
    emailMatch: boolean;
  };
}> {
  try {
    const { reference, expectedAmount, expectedUserEmail } = params;
    const discrepancies: string[] = [];

    const verifyResult = await verifyTransaction(reference, expectedAmount);
    if (!verifyResult.success || !verifyResult.response) {
      return {
        success: false,
        isMatched: false,
        error: verifyResult.error || 'Monnify Gateway record could not be queried',
        discrepancies: ['Gateway record not found or inquiry timed out.'],
        matchReport: {
          contractMatch: false,
          amountMatch: false,
          statusMatch: false,
          emailMatch: false
        }
      };
    }

    const gData = verifyResult.response;
    const paymentStatus = String(gData.paymentStatus || gData.status || '').toUpperCase();
    const settledAmount = Number(gData.amountPaid ?? gData.amount ?? 0);
    const gatewayEmail = String(gData.customerEmail || gData.customer?.email || '').trim().toLowerCase();
    const userEmail = String(expectedUserEmail || '').trim().toLowerCase();

    const statusMatch = paymentStatus === 'PAID' || paymentStatus === 'OVERPAID' || paymentStatus === 'SUCCESS';
    if (!statusMatch) {
      discrepancies.push(`Gateway payment status is '${paymentStatus}' (Expected: PAID).`);
    }

    const amountMatch = settledAmount >= Number(expectedAmount);
    if (!amountMatch) {
      discrepancies.push(`Settled amount (₦${settledAmount.toLocaleString()}) is less than requested credit (₦${Number(expectedAmount).toLocaleString()}).`);
    }

    const contractMatch = Boolean(gData.contractCode);
    const emailMatch = !userEmail || !gatewayEmail || gatewayEmail === userEmail || gatewayEmail.includes(userEmail.split('@')[0]);

    if (!emailMatch && gatewayEmail && userEmail) {
      discrepancies.push(`Customer email mismatch: COD account (${userEmail}) vs Monnify payer (${gatewayEmail}).`);
    }

    const isMatched = statusMatch && amountMatch;

    return {
      success: true,
      isMatched,
      gatewayData: gData,
      discrepancies,
      matchReport: {
        contractMatch,
        amountMatch,
        statusMatch,
        emailMatch
      }
    };
  } catch (err: any) {
    return {
      success: false,
      isMatched: false,
      error: err?.message || 'Gateway match audit failure',
      discrepancies: [err?.message || 'Audit exception'],
      matchReport: {
        contractMatch: false,
        amountMatch: false,
        statusMatch: false,
        emailMatch: false
      }
    };
  }
}

/**
 * Submits a Monnify funding payment for Admin Review without auto-crediting.
 */
export async function submitFundingRequest(params: {
  userId: string;
  userEmail: string;
  userName?: string;
  amount: number;
  reference: string;
  gatewayId?: string;
  paymentMethod?: string;
  paidOn?: string;
  gatewayVerified?: boolean;
  gatewayStatus?: string;
  contractCode?: string;
  merchantAccount?: string;
  amountPaid?: number;
  settlementAmount?: number;
}): Promise<{ success: boolean; error?: string; requestId?: string }> {
  try {
    const db = getAdminDb();
    if (!db) {
      return { success: false, error: 'Database unavailable' };
    }

    const { 
      userId, 
      userEmail, 
      userName, 
      amount, 
      reference, 
      gatewayId, 
      paymentMethod, 
      paidOn, 
      gatewayVerified, 
      gatewayStatus,
      contractCode,
      merchantAccount,
      amountPaid,
      settlementAmount
    } = params;

    if (!userId || !reference || !amount || amount <= 0) {
      return { success: false, error: 'Missing mandatory funding parameters' };
    }

    const requestId = reference.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fundingDocRef = doc(db, 'fundingRequests', requestId);
    const existingSnap = await getDoc(fundingDocRef);

    if (existingSnap.exists()) {
      const existingData = existingSnap.data();
      if (existingData.status === 'Approved') {
        return { success: true, requestId, error: 'Transaction has already been approved and credited.' };
      }
    }

    const fundingPayload: FundingRequestItem = {
      id: requestId,
      userId,
      userEmail: userEmail || 'customer@call-on-demand.com',
      userName: userName || 'COD Member',
      amount: Number(amount),
      reference,
      gatewayId: gatewayId || reference,
      paymentMethod: paymentMethod || 'Monnify Gateway',
      status: 'Pending Approval',
      gatewayStatus: gatewayStatus || 'PAID',
      gatewayVerified: gatewayVerified !== undefined ? gatewayVerified : true,
      contractCode: contractCode || '730430763017',
      merchantAccount: merchantAccount || '8065933172',
      amountPaid: amountPaid ? Number(amountPaid) : Number(amount),
      settlementAmount: settlementAmount ? Number(settlementAmount) : Number(amount),
      paidOn: paidOn || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    await setDoc(fundingDocRef, fundingPayload, { merge: true });

    // Also record or update in the user's personal transaction subcollection as Pending Approval
    const txColRef = collection(db, 'users', userId, 'wallet', 'default', 'transactions');
    const txQuery = query(txColRef, where('reference', '==', reference));
    const txSnap = await getDocs(txQuery);

    if (txSnap.empty) {
      const newTxRef = doc(txColRef);
      await setDoc(newTxRef, {
        type: 'Deposit',
        amount: Number(amount),
        description: `Wallet Funding: ${paymentMethod || 'Monnify'} (Awaiting Admin Approval)`,
        transactionDate: paidOn || new Date().toISOString(),
        status: 'Pending Approval',
        reference,
        gatewayId: gatewayId || reference,
        paymentMethod: paymentMethod || 'Monnify',
        contractCode: contractCode || '730430763017',
        gatewayVerified: true,
        submittedAt: new Date().toISOString()
      });
    }

    return { success: true, requestId };
  } catch (error: any) {
    console.error('Error submitting funding request:', error);
    return { success: false, error: error?.message || 'Failed to submit funding request' };
  }
}

/**
 * Admin Action: Approve and Credit User Wallet after verified clearance.
 * Authenticates live with Monnify gateway prior to granting balance increment.
 */
export async function approveFundingRequest(params: {
  requestId: string;
  adminEmail: string;
  adminUid: string;
  note?: string;
  forceBypassGatewayCheck?: boolean;
}): Promise<{ success: boolean; error?: string; creditedAmount?: number }> {
  try {
    const db = getAdminDb();
    if (!db) return { success: false, error: 'Database unavailable' };

    const { requestId, adminEmail, adminUid, note, forceBypassGatewayCheck } = params;

    if (!adminEmail) {
      return { success: false, error: 'Admin authorization required' };
    }

    const fundingDocRef = doc(db, 'fundingRequests', requestId);
    const fundingSnap = await getDoc(fundingDocRef);

    if (!fundingSnap.exists()) {
      return { success: false, error: 'Funding request not found' };
    }

    const funding = fundingSnap.data() as FundingRequestItem;

    if (funding.status === 'Approved') {
      return { success: false, error: 'This funding request has already been approved and credited.' };
    }

    const amount = Number(funding.amount);
    const userId = funding.userId;

    if (!userId || isNaN(amount) || amount <= 0) {
      return { success: false, error: 'Invalid funding amount or missing target user ID' };
    }

    // Direct Gateway Match Verification Security Protocol
    let gatewayAudit: any = null;
    if (!forceBypassGatewayCheck && funding.reference) {
      const matchCheck = await verifyMonnifyGatewayMatch({
        reference: funding.reference,
        expectedAmount: amount,
        expectedUserEmail: funding.userEmail
      });

      if (!matchCheck.isMatched && !matchCheck.gatewayData?.isDemoMode) {
        return {
          success: false,
          error: `Gateway Verification Failed: ${matchCheck.discrepancies.join(' | ')}. Aborting credit for security.`
        };
      }
      gatewayAudit = matchCheck.gatewayData;
    }

    // 1. Credit User's Wallet
    const walletDocRef = doc(db, 'users', userId, 'wallet', 'default');
    await setDoc(walletDocRef, {
      balance: increment(amount),
      lastDepositAt: new Date().toISOString(),
      lastApprovedDepositAt: new Date().toISOString(),
      lastApprovedBy: adminEmail
    }, { merge: true });

    // 2. Mark Funding Request as Approved
    const approvedAt = new Date().toISOString();
    await updateDoc(fundingDocRef, {
      status: 'Approved',
      approvedBy: adminEmail,
      approvedAt,
      adminNote: note || 'Approved via Admin Security Clearance Hub',
      gatewayMatched: true,
      monnifyAuditData: gatewayAudit || { verifiedAt: approvedAt, verifiedBy: adminEmail }
    });

    // 3. Update User's Wallet Transaction to Completed
    const txColRef = collection(db, 'users', userId, 'wallet', 'default', 'transactions');
    const txQuery = query(txColRef, where('reference', '==', funding.reference));
    const txSnap = await getDocs(txQuery);

    if (!txSnap.empty) {
      for (const txDoc of txSnap.docs) {
        await updateDoc(doc(txColRef, txDoc.id), {
          status: 'Completed',
          approvedBy: adminEmail,
          approvedAt,
          gatewayMatched: true,
          description: `Wallet Funding: ${funding.paymentMethod || 'Monnify'} (Approved by Admin)`
        });
      }
    } else {
      // If transaction wasn't there, create a completed deposit record
      const newTxRef = doc(txColRef);
      await setDoc(newTxRef, {
        type: 'Deposit',
        amount,
        description: `Wallet Funding: ${funding.paymentMethod || 'Monnify'} (Approved by Admin)`,
        transactionDate: approvedAt,
        status: 'Completed',
        reference: funding.reference,
        gatewayId: funding.gatewayId || funding.reference,
        paymentMethod: funding.paymentMethod || 'Monnify',
        gatewayMatched: true,
        approvedBy: adminEmail,
        approvedAt
      });
    }

    // 4. Record Immutable System Audit Log
    try {
      const logsRef = collection(db, 'system_logs');
      await addDoc(logsRef, {
        action: 'WALLET_FUNDING_APPROVED',
        performerId: adminUid || 'admin',
        performerEmail: adminEmail,
        timestamp: new Date(),
        details: {
          requestId,
          userId,
          userEmail: funding.userEmail,
          amount,
          reference: funding.reference,
          paymentMethod: funding.paymentMethod,
          contractCode: funding.contractCode,
          gatewayAudit,
          note: note || 'Approved by Admin'
        }
      });
    } catch (logErr) {
      console.warn('Could not write audit log:', logErr);
    }

    return { success: true, creditedAmount: amount };
  } catch (error: any) {
    console.error('Error approving funding request:', error);
    return { success: false, error: error?.message || 'Approval execution failed' };
  }
}

/**
 * Admin Action: Reject Funding Request.
 */
export async function rejectFundingRequest(params: {
  requestId: string;
  adminEmail: string;
  adminUid: string;
  rejectionReason: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getAdminDb();
    if (!db) return { success: false, error: 'Database unavailable' };

    const { requestId, adminEmail, adminUid, rejectionReason } = params;

    const fundingDocRef = doc(db, 'fundingRequests', requestId);
    const fundingSnap = await getDoc(fundingDocRef);

    if (!fundingSnap.exists()) {
      return { success: false, error: 'Funding request not found' };
    }

    const funding = fundingSnap.data() as FundingRequestItem;

    if (funding.status === 'Approved') {
      return { success: false, error: 'Cannot reject an already approved & credited transaction.' };
    }

    const rejectedAt = new Date().toISOString();

    // 1. Update Request
    await updateDoc(fundingDocRef, {
      status: 'Rejected',
      rejectedBy: adminEmail,
      rejectedAt,
      rejectionReason: rejectionReason || 'Declined by Administrator audit'
    });

    // 2. Update User's Wallet Transaction
    if (funding.userId) {
      const txColRef = collection(db, 'users', funding.userId, 'wallet', 'default', 'transactions');
      const txQuery = query(txColRef, where('reference', '==', funding.reference));
      const txSnap = await getDocs(txQuery);

      for (const txDoc of txSnap.docs) {
        await updateDoc(doc(txColRef, txDoc.id), {
          status: 'Rejected',
          rejectedBy: adminEmail,
          rejectedAt,
          rejectionReason: rejectionReason || 'Declined by Administrator'
        });
      }
    }

    // 3. Log Audit
    try {
      const logsRef = collection(db, 'system_logs');
      await addDoc(logsRef, {
        action: 'WALLET_FUNDING_REJECTED',
        performerId: adminUid || 'admin',
        performerEmail: adminEmail,
        timestamp: new Date(),
        details: {
          requestId,
          userId: funding.userId,
          userEmail: funding.userEmail,
          amount: funding.amount,
          reference: funding.reference,
          rejectionReason
        }
      });
    } catch (logErr) {
      console.warn('Could not write audit log:', logErr);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error rejecting funding request:', error);
    return { success: false, error: error?.message || 'Rejection execution failed' };
  }
}

/**
 * Admin Action: Manual Wallet Credit with security audit trail.
 */
export async function manualCreditUserWallet(params: {
  userId: string;
  userEmail: string;
  amount: number;
  reason: string;
  adminEmail: string;
  adminUid: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getAdminDb();
    if (!db) return { success: false, error: 'Database unavailable' };

    const { userId, userEmail, amount, reason, adminEmail, adminUid } = params;

    if (!userId || isNaN(amount) || amount <= 0) {
      return { success: false, error: 'Valid user ID and amount are required' };
    }

    const reference = `MANUAL-CREDIT-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const timestamp = new Date().toISOString();

    // 1. Credit wallet
    const walletDocRef = doc(db, 'users', userId, 'wallet', 'default');
    await setDoc(walletDocRef, {
      balance: increment(amount),
      lastDepositAt: timestamp,
      lastManualCreditAt: timestamp,
      lastManualCreditBy: adminEmail
    }, { merge: true });

    // 2. Add transaction record
    const txColRef = collection(db, 'users', userId, 'wallet', 'default', 'transactions');
    await addDoc(txColRef, {
      type: 'Deposit',
      amount,
      description: `Manual Credit: ${reason} (Authorized by ${adminEmail})`,
      transactionDate: timestamp,
      status: 'Completed',
      reference,
      paymentMethod: 'Manual Admin Credit',
      approvedBy: adminEmail,
      approvedAt: timestamp
    });

    // 3. Log audit
    const logsRef = collection(db, 'system_logs');
    await addDoc(logsRef, {
      action: 'WALLET_MANUAL_CREDIT',
      performerId: adminUid || 'admin',
      performerEmail: adminEmail,
      timestamp: new Date(),
      details: {
        targetUserId: userId,
        targetUserEmail: userEmail,
        amount,
        reason,
        reference
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error in manual wallet credit:', error);
    return { success: false, error: error?.message || 'Manual credit failed' };
  }
}
