import Decimal from 'decimal.js';

/**
 * Event emitted when a payment method is created
 */
export interface PaymentMethodCreatedEvent {
  eventId: string;
  timestamp: Date;
  userId: string;
  userDisplayCode: string;
  methodId: string;
  methodType: 'card' | 'bank' | 'crypto';
  provider: string;
  status: 'pending' | 'verified' | 'disabled';
}

/**
 * Event emitted when a payment method is verified
 */
export interface PaymentMethodVerifiedEvent {
  eventId: string;
  timestamp: Date;
  userId: string;
  userDisplayCode: string;
  methodId: string;
  methodType: 'card' | 'bank' | 'crypto';
  provider: string;
}

/**
 * Event emitted when a wallet deposit is initiated
 */
export interface WalletDepositInitiatedEvent {
  eventId: string;
  timestamp: Date;
  userId: string;
  userDisplayCode: string;
  amountUSDT: Decimal;
  methodId: string;
  methodType: 'card' | 'bank' | 'crypto';
  provider: string;
}

/**
 * Event emitted when a wallet is funded (deposit completed)
 */
export interface WalletFundedEvent {
  eventId: string;
  timestamp: Date;
  userId: string;
  userDisplayCode: string;
  amountUSDT: Decimal;
  transactionId: string;
  transactionDisplayCode: string;
  methodId?: string | null;
  methodType?: 'card' | 'bank' | 'crypto' | null;
  provider?: string | null;
}
