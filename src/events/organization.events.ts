import Decimal from 'decimal.js';

/**
 * Event emitted when organization liquidity is updated
 */
export interface OrganizationLiquidityUpdatedEvent {
  eventId: string;
  timestamp: Date;
  organizationId: string;
  organizationDisplayCode: string;
  previousLiquidityUSDT: Decimal;
  newLiquidityUSDT: Decimal;
  changeAmountUSDT: Decimal;
  changeType: 'increase' | 'decrease';
  reason: string;
}
