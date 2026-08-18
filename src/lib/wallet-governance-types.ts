export interface FundingRequestItem {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  amount: number;
  reference: string;
  gatewayId?: string;
  paymentMethod?: string;
  status: 'Pending Approval' | 'Approved' | 'Rejected' | 'Blocked' | 'Flagged';
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
  blockedBy?: string;
  blockedAt?: string;
  blockReason?: string;
  flaggedBy?: string;
  flaggedAt?: string;
  flagReason?: string;
  approvalModeApplied?: string;
  exceededThreshold?: boolean;
  gatewayMatched?: boolean;
  monnifyAuditData?: any;
  adminNote?: string;
}

export interface WalletGovernanceSettings {
  approvalMode: 'FLEXIBLE_THRESHOLD' | 'MANUAL_ALL' | 'INSTANT_AUTO';
  approvalThreshold: number; // e.g. 50,000 NGN
  maxTransactionLimit: number; // e.g. 1,000,000 NGN
  dailySpendingLimit: number; // e.g. 3,000,000 NGN
  minFundingAmount: number; // e.g. 100 NGN
  emergencyWalletLockdown: boolean;
  autoBlockSuspicious: boolean;
  blockNewDeposits: boolean;
  blockWithdrawals: boolean;
  blockVASPayments: boolean;
  lastUpdatedBy?: string;
  lastUpdatedAt?: string;
}

export const DEFAULT_WALLET_GOVERNANCE: WalletGovernanceSettings = {
  approvalMode: 'FLEXIBLE_THRESHOLD',
  approvalThreshold: 100000, // Deposits > 100,000 require manual admin clearance
  maxTransactionLimit: 2000000, // Max single transaction 2,000,000
  dailySpendingLimit: 5000000,
  minFundingAmount: 100,
  emergencyWalletLockdown: false,
  autoBlockSuspicious: true,
  blockNewDeposits: false,
  blockWithdrawals: false,
  blockVASPayments: false
};
