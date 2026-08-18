'use server';

import { getAdminDb } from '@/firebase/server';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, increment, addDoc } from 'firebase/firestore';
import { verifyTransaction } from './monnify';
import { 
  type FundingRequestItem, 
  type WalletGovernanceSettings, 
  DEFAULT_WALLET_GOVERNANCE 
} from '@/lib/wallet-governance-types';

export type { FundingRequestItem, WalletGovernanceSettings };

const MASTER_ADMIN_EMAILS = [
  'altamambcs@callondemandbiz.com',
  'tatatradeandinnovation@gmail.com',
  'altamam02@gmail.com'
];

/**
 * Retrieves the current live Wallet Governance Settings from Firestore,
 * falling back gracefully to DEFAULT_WALLET_GOVERNANCE if unset.
 */
export async function getWalletGovernanceSettings(): Promise<WalletGovernanceSettings> {
  try {
    const db = getAdminDb();
    if (!db) return DEFAULT_WALLET_GOVERNANCE;

    const govRef = doc(db, 'application_settings', 'wallet_governance');
    const snap = await getDoc(govRef);

    if (snap.exists()) {
      return {
        ...DEFAULT_WALLET_GOVERNANCE,
        ...snap.data()
      } as WalletGovernanceSettings;
    }
    return DEFAULT_WALLET_GOVERNANCE;
  } catch (err) {
    console.error('Error fetching wallet governance settings:', err);
    return DEFAULT_WALLET_GOVERNANCE;
  }
}

/**
 * Admin Action: Updates the global Wallet Governance Settings with audit logging.
 */
export async function updateWalletGovernanceSettings(params: {
  settings: Partial<WalletGovernanceSettings>;
  adminEmail: string;
  adminUid: string;
}): Promise<{ success: boolean; error?: string; settings?: WalletGovernanceSettings }> {
  try {
    const db = getAdminDb();
    if (!db) return { success: false, error: 'Database unavailable' };

    const { settings, adminEmail, adminUid } = params;
    if (!adminEmail) return { success: false, error: 'Admin authorization required' };

    const current = await getWalletGovernanceSettings();
    const updatedSettings: WalletGovernanceSettings = {
      ...current,
      ...settings,
      lastUpdatedBy: adminEmail,
      lastUpdatedAt: new Date().toISOString()
    };

    const govRef = doc(db, 'application_settings', 'wallet_governance');
    await setDoc(govRef, updatedSettings, { merge: true });

    // Log to system audit trail
    try {
      const logsRef = collection(db, 'system_logs');
      await addDoc(logsRef, {
        action: 'WALLET_GOVERNANCE_UPDATED',
        performerId: adminUid || 'admin',
        performerEmail: adminEmail,
        timestamp: new Date(),
        details: {
          previousApprovalMode: current.approvalMode,
          newApprovalMode: updatedSettings.approvalMode,
          previousThreshold: current.approvalThreshold,
          newThreshold: updatedSettings.approvalThreshold,
          maxTransactionLimit: updatedSettings.maxTransactionLimit,
          emergencyWalletLockdown: updatedSettings.emergencyWalletLockdown,
          blockNewDeposits: updatedSettings.blockNewDeposits,
          blockWithdrawals: updatedSettings.blockWithdrawals,
          blockVASPayments: updatedSettings.blockVASPayments,
          autoBlockSuspicious: updatedSettings.autoBlockSuspicious
        }
      });
    } catch (logErr) {
      console.warn('Audit log write error:', logErr);
    }

    return { success: true, settings: updatedSettings };
  } catch (err: any) {
    console.error('Error updating wallet governance settings:', err);
    return { success: false, error: err?.message || 'Failed to update governance settings' };
  }
}

/**
 * Admin Action: Blocks a suspicious or fraudulent transaction from clearing.
 */
export async function blockFundingRequest(params: {
  requestId: string;
  adminEmail: string;
  adminUid: string;
  blockReason: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getAdminDb();
    if (!db) return { success: false, error: 'Database unavailable' };

    const { requestId, adminEmail, adminUid, blockReason } = params;
    if (!adminEmail) return { success: false, error: 'Admin authorization required' };

    const fundingDocRef = doc(db, 'fundingRequests', requestId);
    const fundingSnap = await getDoc(fundingDocRef);

    if (!fundingSnap.exists()) {
      return { success: false, error: 'Funding request not found' };
    }

    const funding = fundingSnap.data() as FundingRequestItem;
    if (funding.status === 'Approved') {
      return { success: false, error: 'Cannot block an already approved & credited transaction.' };
    }

    const blockedAt = new Date().toISOString();

    // 1. Update Funding Request
    await updateDoc(fundingDocRef, {
      status: 'Blocked',
      blockedBy: adminEmail,
      blockedAt,
      blockReason: blockReason || 'Transaction blocked by Admin Security Protocol'
    });

    // 2. Update User's Wallet Transaction
    if (funding.userId) {
      const txColRef = collection(db, 'users', funding.userId, 'wallet', 'default', 'transactions');
      const txQuery = query(txColRef, where('reference', '==', funding.reference));
      const txSnap = await getDocs(txQuery);

      for (const txDoc of txSnap.docs) {
        await updateDoc(doc(txColRef, txDoc.id), {
          status: 'Blocked',
          blockedBy: adminEmail,
          blockedAt,
          blockReason: blockReason || 'Transaction blocked by Admin Security Protocol'
        });
      }
    }

    // 3. Log Audit
    try {
      const logsRef = collection(db, 'system_logs');
      await addDoc(logsRef, {
        action: 'WALLET_FUNDING_BLOCKED',
        performerId: adminUid || 'admin',
        performerEmail: adminEmail,
        timestamp: new Date(),
        details: {
          requestId,
          userId: funding.userId,
          userEmail: funding.userEmail,
          amount: funding.amount,
          reference: funding.reference,
          blockReason
        }
      });
    } catch (logErr) {
      console.warn('Audit log write error:', logErr);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error blocking funding request:', error);
    return { success: false, error: error?.message || 'Block operation failed' };
  }
}

/**
 * Admin Action: Flags a transaction for enhanced compliance/fraud review.
 */
export async function flagFundingRequest(params: {
  requestId: string;
  adminEmail: string;
  adminUid: string;
  flagReason: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getAdminDb();
    if (!db) return { success: false, error: 'Database unavailable' };

    const { requestId, adminEmail, adminUid, flagReason } = params;
    if (!adminEmail) return { success: false, error: 'Admin authorization required' };

    const fundingDocRef = doc(db, 'fundingRequests', requestId);
    const fundingSnap = await getDoc(fundingDocRef);

    if (!fundingSnap.exists()) {
      return { success: false, error: 'Funding request not found' };
    }

    const funding = fundingSnap.data() as FundingRequestItem;
    const flaggedAt = new Date().toISOString();

    // 1. Update Funding Request
    await updateDoc(fundingDocRef, {
      status: 'Flagged',
      flaggedBy: adminEmail,
      flaggedAt,
      flagReason: flagReason || 'Flagged for compliance investigation'
    });

    // 2. Update User's Wallet Transaction
    if (funding.userId) {
      const txColRef = collection(db, 'users', funding.userId, 'wallet', 'default', 'transactions');
      const txQuery = query(txColRef, where('reference', '==', funding.reference));
      const txSnap = await getDocs(txQuery);

      for (const txDoc of txSnap.docs) {
        await updateDoc(doc(txColRef, txDoc.id), {
          status: 'Flagged',
          flaggedBy: adminEmail,
          flaggedAt,
          flagReason: flagReason || 'Flagged for compliance review'
        });
      }
    }

    // 3. Log Audit
    try {
      const logsRef = collection(db, 'system_logs');
      await addDoc(logsRef, {
        action: 'WALLET_FUNDING_FLAGGED',
        performerId: adminUid || 'admin',
        performerEmail: adminEmail,
        timestamp: new Date(),
        details: {
          requestId,
          userId: funding.userId,
          userEmail: funding.userEmail,
          amount: funding.amount,
          reference: funding.reference,
          flagReason
        }
      });
    } catch (logErr) {
      console.warn('Audit log write error:', logErr);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error flagging funding request:', error);
    return { success: false, error: error?.message || 'Flag operation failed' };
  }
}

/**
 * Admin Action: Freeze or unfreeze a specific user's wallet to prevent any outgoing/incoming actions.
 */
export async function toggleUserWalletFreeze(params: {
  userId: string;
  userEmail: string;
  isFrozen: boolean;
  freezeReason?: string;
  adminEmail: string;
  adminUid: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getAdminDb();
    if (!db) return { success: false, error: 'Database unavailable' };

    const { userId, userEmail, isFrozen, freezeReason, adminEmail, adminUid } = params;
    if (!userId || !adminEmail) return { success: false, error: 'User ID and Admin credentials required' };

    const timestamp = new Date().toISOString();

    // 1. Update wallet default document
    const walletDocRef = doc(db, 'users', userId, 'wallet', 'default');
    await setDoc(walletDocRef, {
      isWalletFrozen: isFrozen,
      freezeReason: isFrozen ? (freezeReason || 'Administrative security freeze') : null,
      freezeUpdatedBy: adminEmail,
      freezeUpdatedAt: timestamp
    }, { merge: true });

    // 2. Update root user profile
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, {
      isWalletFrozen: isFrozen,
      walletFreezeReason: isFrozen ? (freezeReason || 'Administrative security freeze') : null,
      walletFreezeUpdatedAt: timestamp
    }, { merge: true });

    // 3. Log Audit
    try {
      const logsRef = collection(db, 'system_logs');
      await addDoc(logsRef, {
        action: isFrozen ? 'USER_WALLET_FROZEN' : 'USER_WALLET_UNFROZEN',
        performerId: adminUid || 'admin',
        performerEmail: adminEmail,
        timestamp: new Date(),
        details: {
          targetUserId: userId,
          targetUserEmail: userEmail,
          isFrozen,
          freezeReason
        }
      });
    } catch (logErr) {
      console.warn('Audit log write error:', logErr);
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error toggling wallet freeze:', err);
    return { success: false, error: err?.message || 'Wallet freeze toggle failed' };
  }
}

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
 * Submits a Monnify funding payment for verification and processing under live Wallet Governance Rules.
 * Respects Flexible Threshold, Instant Auto, and Manual Approval governance modes.
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
}): Promise<{ 
  success: boolean; 
  error?: string; 
  requestId?: string; 
  status?: 'Approved' | 'Pending Approval' | 'Blocked' | 'Flagged';
  autoApproved?: boolean;
  approvalModeApplied?: string;
}> {
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
      gatewayVerified = true, 
      gatewayStatus = 'PAID',
      contractCode,
      merchantAccount,
      amountPaid,
      settlementAmount
    } = params;

    const numAmount = Number(amount);
    if (!userId || !reference || isNaN(numAmount) || numAmount <= 0) {
      return { success: false, error: 'Missing mandatory funding parameters' };
    }

    // 1. Fetch current live Governance Settings
    const governance = await getWalletGovernanceSettings();

    // 2. Emergency lockdown check
    if (governance.emergencyWalletLockdown) {
      return { 
        success: false, 
        error: 'Wallet operations are temporarily suspended due to emergency system maintenance.' 
      };
    }

    // 3. New deposits blocked check
    if (governance.blockNewDeposits) {
      return { 
        success: false, 
        error: 'New wallet deposits are currently blocked by system administration.' 
      };
    }

    // 4. Check if User Wallet is Frozen
    const userDocRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      if (userData.isWalletFrozen) {
        return { 
          success: false, 
          error: `Your wallet is currently frozen by administration (${userData.walletFreezeReason || 'Security restrictions'}). Please contact support.` 
        };
      }
    }

    // 5. Min funding amount verification
    const minAmount = governance.minFundingAmount || 100;
    if (numAmount < minAmount) {
      return { 
        success: false, 
        error: `Minimum allowable deposit is ₦${minAmount.toLocaleString()}.` 
      };
    }

    const requestId = reference.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fundingDocRef = doc(db, 'fundingRequests', requestId);
    const existingSnap = await getDoc(fundingDocRef);

    if (existingSnap.exists()) {
      const existingData = existingSnap.data();
      if (existingData.status === 'Approved') {
        return { 
          success: true, 
          requestId, 
          status: 'Approved',
          autoApproved: true,
          error: 'Transaction has already been approved and credited.' 
        };
      }
    }

    // 6. Determine Governance Approval Routing
    let finalStatus: 'Approved' | 'Pending Approval' | 'Blocked' | 'Flagged' = 'Pending Approval';
    let approvalModeApplied: string = governance.approvalMode;
    let exceededThreshold = false;
    let blockReason: string | undefined = undefined;
    let autoApproved = false;

    const maxLimit = governance.maxTransactionLimit || 2000000;
    const threshold = governance.approvalThreshold || 100000;
    const isPaymentPaid = gatewayStatus === 'PAID' || gatewayStatus === 'SUCCESS' || gatewayStatus === 'OVERPAID';

    // Check suspicious / unverified
    if (!isPaymentPaid && governance.autoBlockSuspicious) {
      finalStatus = 'Blocked';
      blockReason = `Auto-blocked: Gateway payment status is '${gatewayStatus}' instead of PAID.`;
    } else if (numAmount > maxLimit) {
      // Exceeded max single transaction limit -> must hold for review
      finalStatus = 'Pending Approval';
      exceededThreshold = true;
      approvalModeApplied = `${governance.approvalMode}_EXCEEDED_MAX_LIMIT`;
    } else {
      switch (governance.approvalMode) {
        case 'INSTANT_AUTO':
          if (gatewayVerified && isPaymentPaid) {
            finalStatus = 'Approved';
            autoApproved = true;
            approvalModeApplied = 'INSTANT_AUTO';
          } else {
            finalStatus = 'Pending Approval';
          }
          break;

        case 'FLEXIBLE_THRESHOLD':
          if (numAmount <= threshold && gatewayVerified && isPaymentPaid) {
            finalStatus = 'Approved';
            autoApproved = true;
            approvalModeApplied = 'FLEXIBLE_THRESHOLD_AUTO';
            exceededThreshold = false;
          } else {
            finalStatus = 'Pending Approval';
            exceededThreshold = numAmount > threshold;
            approvalModeApplied = 'FLEXIBLE_THRESHOLD_MANUAL';
          }
          break;

        case 'MANUAL_ALL':
        default:
          finalStatus = 'Pending Approval';
          approvalModeApplied = 'MANUAL_ALL';
          exceededThreshold = false;
          break;
      }
    }

    const timestamp = new Date().toISOString();
    const fundingPayload: FundingRequestItem = {
      id: requestId,
      userId,
      userEmail: userEmail || 'customer@call-on-demand.com',
      userName: userName || 'COD Member',
      amount: numAmount,
      reference,
      gatewayId: gatewayId || reference,
      paymentMethod: paymentMethod || 'Monnify Gateway',
      status: finalStatus,
      gatewayStatus,
      gatewayVerified,
      contractCode: contractCode || '730430763017',
      merchantAccount: merchantAccount || '8065933172',
      amountPaid: amountPaid ? Number(amountPaid) : numAmount,
      settlementAmount: settlementAmount ? Number(settlementAmount) : numAmount,
      paidOn: paidOn || timestamp,
      createdAt: timestamp,
      approvalModeApplied,
      exceededThreshold,
      gatewayMatched: isPaymentPaid,
      ...(finalStatus === 'Approved' ? {
        approvedBy: 'SYSTEM_GOVERNANCE_AUTO_RULE',
        approvedAt: timestamp,
        adminNote: `Auto-credited via ${approvalModeApplied}`
      } : {}),
      ...(finalStatus === 'Blocked' ? {
        blockedBy: 'SYSTEM_AUTO_BLOCK_GOVERNANCE',
        blockedAt: timestamp,
        blockReason
      } : {})
    };

    await setDoc(fundingDocRef, fundingPayload, { merge: true });

    // 7. If Auto-Approved, credit wallet immediately
    if (finalStatus === 'Approved') {
      const walletDocRef = doc(db, 'users', userId, 'wallet', 'default');
      await setDoc(walletDocRef, {
        balance: increment(numAmount),
        lastDepositAt: timestamp,
        lastAutoDepositAt: timestamp
      }, { merge: true });
    }

    // 8. Record in user transaction subcollection
    const txColRef = collection(db, 'users', userId, 'wallet', 'default', 'transactions');
    const txQuery = query(txColRef, where('reference', '==', reference));
    const txSnap = await getDocs(txQuery);

    const userTxStatus = finalStatus === 'Approved' ? 'Completed' : finalStatus;
    const userTxDesc = finalStatus === 'Approved'
      ? `Wallet Funding: ${paymentMethod || 'Monnify'} (Auto-Approved)`
      : finalStatus === 'Blocked'
      ? `Wallet Funding: ${paymentMethod || 'Monnify'} (Blocked by Governance)`
      : `Wallet Funding: ${paymentMethod || 'Monnify'} (Awaiting Admin Clearance${exceededThreshold ? ` - Exceeded ₦${threshold.toLocaleString()} Threshold` : ''})`;

    if (txSnap.empty) {
      const newTxRef = doc(txColRef);
      await setDoc(newTxRef, {
        type: 'Deposit',
        amount: numAmount,
        description: userTxDesc,
        transactionDate: paidOn || timestamp,
        status: userTxStatus,
        reference,
        gatewayId: gatewayId || reference,
        paymentMethod: paymentMethod || 'Monnify',
        contractCode: contractCode || '730430763017',
        gatewayVerified,
        submittedAt: timestamp,
        approvalModeApplied,
        exceededThreshold,
        ...(finalStatus === 'Blocked' ? { blockReason } : {})
      });
    } else {
      for (const txDoc of txSnap.docs) {
        await updateDoc(doc(txColRef, txDoc.id), {
          status: userTxStatus,
          description: userTxDesc,
          approvalModeApplied,
          exceededThreshold,
          ...(finalStatus === 'Blocked' ? { blockReason } : {})
        });
      }
    }

    return { 
      success: true, 
      requestId, 
      status: finalStatus, 
      autoApproved,
      approvalModeApplied
    };
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
