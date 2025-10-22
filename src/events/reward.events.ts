import Decimal from 'decimal.js';

/**
 * Event emitted when rewards are distributed to a user
 */
export interface RewardDistributedEvent {
  eventId: string;
  timestamp: Date;
  userId: string;
  userDisplayCode: string;
  propertyId: string;
  propertyDisplayCode: string;
  organizationId: string;
  organizationDisplayCode: string;
  amountUSDT: Decimal;
  rewardId: string;
  rewardDisplayCode: string;
  investmentId: string;
  investmentDisplayCode: string;
}

/**
 * Event emitted when reward distribution fails
 */
export interface RewardFailedEvent {
  eventId: string;
  timestamp: Date;
  propertyId: string;
  propertyDisplayCode: string;
  userId?: string;
  userDisplayCode?: string;
  reason: string;
  error?: Error;
}
