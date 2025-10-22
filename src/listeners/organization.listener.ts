import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { DataSource, Repository, EntityManager } from 'typeorm';
import { Organization } from '../organizations/entities/organization.entity';
import type { InvestmentCompletedEvent } from '../events/investment.events';
import Decimal from 'decimal.js';

@Injectable()
export class OrganizationListener {
  private readonly logger = new Logger(OrganizationListener.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
  ) {}

  /**
   * Handle investment completed event - update organization liquidity
   */
  @OnEvent('investment.completed', { async: true })
  async handleInvestmentCompleted(event: InvestmentCompletedEvent) {
    try {
      this.logger.log(`Processing organization liquidity update for ${event.organizationDisplayCode}`);

      // Async listener - create new transaction
      await this.dataSource.transaction(async (manager) => {
        await this.updateOrganizationLiquidityInTransaction(
          event.organizationId,
          event.amountUSDT,
          manager
        );
      });

      this.logger.log(`Organization liquidity updated for ${event.organizationDisplayCode}`);
    } catch (error) {
      this.logger.error(`Failed to update organization liquidity for ${event.organizationDisplayCode}:`, error);
      // Don't throw - let the main operation continue
    }
  }

  /**
   * Update organization liquidity after investment
   */
  private async updateOrganizationLiquidityInTransaction(
    organizationId: string,
    amountUSDT: Decimal,
    manager: EntityManager,
  ) {
    const organization = await manager
      .createQueryBuilder(Organization, 'org')
      .where('org.id = :organizationId', { organizationId })
      .setLock('pessimistic_write')
      .getOne();

    if (!organization) {
      this.logger.warn(`Organization not found for ID ${organizationId}`);
      return;
    }

    const previousLiquidity = organization.liquidityUSDT as Decimal;
    organization.liquidityUSDT = previousLiquidity.plus(amountUSDT);
    await manager.save(Organization, organization);

    this.logger.log(`Organization ${organization.displayCode} liquidity updated: ${previousLiquidity.toString()} -> ${organization.liquidityUSDT.toString()}`);
  }
}
