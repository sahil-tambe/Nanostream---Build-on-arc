export interface UserProfile {
  id: number;
  uid: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export interface UserWallet {
  id: number;
  userId: number;
  walletId: string;
  address: string;
  blockchain: string;
  balanceUsdc: string;
  autoStreamEnabled: boolean;
  microRateCap: string;
  dailyBudgetCap: string;
  spentTodayUsdc: string;
  updatedAt: string;
}

export interface X402Service {
  id: number;
  serviceId: string;
  name: string;
  description: string;
  developerWallet: string;
  pricePerUnitUsdc: string;
  unitName: string;
  category: string;
  totalCalls: number;
}

export interface TransactionRecord {
  id: number;
  txHash: string;
  userId: number;
  walletId: number;
  serviceId: string;
  senderAddress: string;
  receiverAddress: string;
  amountUsdc: string;
  status: 'SETTLED' | 'PENDING' | 'FAILED';
  x402HeaderCode: string;
  executionTimeMs: number;
  promptTokenCount: number;
  metadataJson?: string;
  createdAt: string;
}

export interface AuditLogRecord {
  id: number;
  userId: number;
  action: string;
  severity: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  details: string;
  ipAddress?: string;
  createdAt: string;
}
