import { db, auth } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * System Audit Log Actions
 */
export enum AuditAction {
  USER_PROMOTION = 'USER_PROMOTION',
  USER_DEMOTION = 'USER_DEMOTION',
  USER_RESTRICTION = 'USER_RESTRICTION',
  TASK_MODIFICATION = 'TASK_MODIFICATION',
  TASK_DELETION = 'TASK_DELETION',
  TASK_BULK_UPDATE = 'TASK_BULK_UPDATE',
  UNIT_MODIFICATION = 'UNIT_MODIFICATION',
  PLAN_MODIFICATION = 'PLAN_MODIFICATION',
  CONFIG_UPDATE = 'CONFIG_UPDATE',
  ACCESS_DENIED = 'ACCESS_DENIED',
  WALLET_FUNDING_APPROVED = 'WALLET_FUNDING_APPROVED',
  WALLET_FUNDING_REJECTED = 'WALLET_FUNDING_REJECTED',
  WALLET_MANUAL_CREDIT = 'WALLET_MANUAL_CREDIT',
  WALLET_AUTO_CREDIT_DISABLED = 'WALLET_AUTO_CREDIT_DISABLED',
  USER_BULK_WALLET_FREEZE = 'USER_BULK_WALLET_FREEZE',
  USER_BULK_WALLET_UNFREEZE = 'USER_BULK_WALLET_UNFREEZE',
  USER_BULK_RESTRICTION = 'USER_BULK_RESTRICTION',
  USER_BULK_RELEASE_RESTRICTIONS = 'USER_BULK_RELEASE_RESTRICTIONS',
  USER_BULK_STATUS_UPDATE = 'USER_BULK_STATUS_UPDATE',
  USER_BULK_UNIT_ASSIGN = 'USER_BULK_UNIT_ASSIGN',
}

/**
 * Logs an administrative action to the system_logs collection.
 * This is used for compliance and security auditing.
 */
export async function logAuditAction(action: AuditAction, details: Record<string, any>) {
  const user = auth.currentUser;
  if (!user) return;

  try {
    await addDoc(collection(db, 'system_logs'), {
      action,
      performerId: user.uid,
      performerEmail: user.email || null,
      timestamp: serverTimestamp(),
      details,
    });
  } catch (error) {
    console.error('Audit Logging Failed:', error);
  }
}
