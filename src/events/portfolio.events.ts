import Decimal from 'decimal.js';

/**
 * Event emitted when a portfolio is updated
 */
export interface PortfolioUpdatedEvent {
  eventId: string;
  timestamp: Date;
  userId: string;
  userDisplayCode: string;
  portfolioId: string;
  updateType: 'investment' | 'reward' | 'withdrawal';
  previousTotalInvestedUSDT: Decimal;
  newTotalInvestedUSDT: Decimal;
  previousTotalRewardsUSDT: Decimal;
  newTotalRewardsUSDT: Decimal;
  previousTotalROIUSDT: Decimal;
  newTotalROIUSDT: Decimal;
  previousActiveInvestments: number;
  newActiveInvestments: number;
}
