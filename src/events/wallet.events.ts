import Decimal from 'decimal.js';

/**
 * Event emitted when a wallet is credited
 */
export interface WalletCreditedEvent {
  eventId: string;
  timestamp: Date;
  userId: string;
  userDisplayCode: string;
  walletId: string;
  amountUSDT: Decimal;
  newBalanceUSDT: Decimal;
  transactionId?: string;
  transactionDisplayCode?: string;
  description?: string;
}

/**
 * Event emitted when a wallet is debited
 */
export interface WalletDebitedEvent {
  eventId: string;
  timestamp: Date;
  userId: string;
  userDisplayCode: string;
  walletId: string;
  amountUSDT: Decimal;
  newBalanceUSDT: Decimal;
  transactionId?: string;
  transactionDisplayCode?: string;
  description?: string;
}
