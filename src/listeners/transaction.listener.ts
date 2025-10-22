import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import type { InvestmentCompletedEvent } from '../events/investment.events';
import type { RewardDistributedEvent } from '../events/reward.events';
import type { WalletCreditedEvent } from '../events/wallet.events';

@Injectable()
export class TransactionListener {
  private readonly logger = new Logger(TransactionListener.name);

  /**
   * Handle investment completed event - log transaction creation
   * Note: Transaction is already created by InvestmentService
   */
  @OnEvent('investment.completed', { async: true })
  async handleInvestmentTransaction(event: InvestmentCompletedEvent) {
    try {
      this.logger.log(`Investment transaction already created for ${event.userDisplayCode} by InvestmentService`);
      // Transaction is already created by the main service, no need to create another
    } catch (error) {
      this.logger.error(`Failed to log investment transaction for ${event.userDisplayCode}:`, error);
      // Don't throw - let the main operation continue
    }
  }

  /**
   * Handle reward distributed event - log transaction creation
   * Note: Transaction is already created by RewardService
   */
  @OnEvent('reward.distributed', { async: true })
  async handleRewardTransaction(event: RewardDistributedEvent) {
    try {
      this.logger.log(`Reward transaction already created for ${event.userDisplayCode} by RewardService`);
      // Transaction is already created by the main service, no need to create another
    } catch (error) {
      this.logger.error(`Failed to log reward transaction for ${event.userDisplayCode}:`, error);
      // Don't throw - let the main operation continue
    }
  }

  /**
   * Handle wallet credited event - log transaction creation
   * Note: Transaction is already created by WalletService
   */
  @OnEvent('wallet.credited', { async: true })
  async handleWalletCredit(event: WalletCreditedEvent) {
    try {
      this.logger.log(`Wallet credit transaction already created for ${event.userDisplayCode} by WalletService`);
      // Transaction is already created by the main service, no need to create another
    } catch (error) {
      this.logger.error(`Failed to log wallet credit transaction for ${event.userDisplayCode}:`, error);
      // Don't throw - let the main operation continue
    }
  }

}
