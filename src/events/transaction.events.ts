import Decimal from 'decimal.js';

/**
 * Event emitted when a transaction is recorded
 */
export interface TransactionRecordedEvent {
  eventId: string;
  timestamp: Date;
  transactionId: string;
  transactionDisplayCode: string;
  userId?: string;
  userDisplayCode?: string;
  walletId?: string;
  organizationId?: string;
  organizationDisplayCode?: string;
  propertyId?: string;
  propertyDisplayCode?: string;
  type: 'deposit' | 'withdrawal' | 'investment' | 'return' | 'fee' | 'reward' | 'inflow';
  amountUSDT: Decimal;
  status: string;
  fromEntity?: string;
  toEntity?: string;
  referenceId?: string;
  description?: string;
}
