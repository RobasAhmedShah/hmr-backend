import Decimal from 'decimal.js';

/**
 * Event emitted when an investment is successfully completed
 */
export interface InvestmentCompletedEvent {
  eventId: string;
  timestamp: Date;
  userId: string;
  userDisplayCode: string;
  propertyId: string;
  propertyDisplayCode: string;
  organizationId: string;
  organizationDisplayCode: string;
  tokensPurchased: Decimal;
  amountUSDT: Decimal;
  investmentId: string;
  investmentDisplayCode: string;
}

/**
 * Event emitted when an investment fails
 */
export interface InvestmentFailedEvent {
  eventId: string;
  timestamp: Date;
  userId: string;
  userDisplayCode: string;
  propertyId: string;
  propertyDisplayCode: string;
  reason: string;
  error?: Error;
}

