import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { DataSource, Repository, EntityManager } from 'typeorm';
import { Portfolio } from '../portfolio/entities/portfolio.entity';
import type { InvestmentCompletedEvent } from '../events/investment.events';
import type { RewardDistributedEvent } from '../events/reward.events';
import Decimal from 'decimal.js';

@Injectable()
export class PortfolioListener {
  private readonly logger = new Logger(PortfolioListener.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Portfolio)
    private readonly portfolioRepo: Repository<Portfolio>,
  ) {}

  /**
   * Handle investment completed event - update portfolio totals
   */
  @OnEvent('investment.completed', { async: true })
  async handleInvestmentCompleted(event: InvestmentCompletedEvent) {
    try {
      this.logger.log(`Processing investment completed for user ${event.userDisplayCode}`);

      // Async listener - create new transaction
      await this.dataSource.transaction(async (manager) => {
        await this.updatePortfolioInTransaction(
          event.userId,
          event.amountUSDT,
          'investment',
          manager
        );
      });

      this.logger.log(`Portfolio updated for user ${event.userDisplayCode} after investment`);
    } catch (error) {
      this.logger.error(`Failed to update portfolio for user ${event.userDisplayCode}:`, error);
      // Don't throw - let the main operation continue
    }
  }

  /**
   * Handle reward distributed event - update portfolio rewards
   */
  @OnEvent('reward.distributed', { async: true })
  async handleRewardDistributed(event: RewardDistributedEvent) {
    try {
      this.logger.log(`Processing reward distributed for user ${event.userDisplayCode}`);

      // Async listener - create new transaction
      await this.dataSource.transaction(async (manager) => {
        await this.updatePortfolioRewardsInTransaction(
          event.userId,
          event.amountUSDT,
          manager
        );
      });

      this.logger.log(`Portfolio rewards updated for user ${event.userDisplayCode}`);
    } catch (error) {
      this.logger.error(`Failed to update portfolio rewards for user ${event.userDisplayCode}:`, error);
      // Don't throw - let the main operation continue
    }
  }

  /**
   * Update portfolio after investment
   */
  private async updatePortfolioInTransaction(
    userId: string,
    amountUSDT: Decimal,
    type: 'investment' | 'reward',
    manager: EntityManager,
  ) {
    const portfolio = await manager.findOne(Portfolio, {
      where: { userId },
    });

    if (!portfolio) {
      this.logger.warn(`Portfolio not found for user ${userId}`);
      return;
    }

    if (type === 'investment') {
      portfolio.totalInvestedUSDT = (portfolio.totalInvestedUSDT as Decimal).plus(amountUSDT);
      portfolio.activeInvestments += 1;
    }

    portfolio.lastUpdated = new Date();
    await manager.save(Portfolio, portfolio);
  }

  /**
   * Update portfolio rewards
   */
  private async updatePortfolioRewardsInTransaction(
    userId: string,
    amountUSDT: Decimal,
    manager: EntityManager,
  ) {
    const portfolio = await manager.findOne(Portfolio, {
      where: { userId },
    });

    if (!portfolio) {
      this.logger.warn(`Portfolio not found for user ${userId}`);
      return;
    }

    portfolio.totalRewardsUSDT = (portfolio.totalRewardsUSDT as Decimal).plus(amountUSDT);
    portfolio.totalROIUSDT = (portfolio.totalROIUSDT as Decimal).plus(amountUSDT);
    portfolio.lastUpdated = new Date();
    await manager.save(Portfolio, portfolio);
  }
}
