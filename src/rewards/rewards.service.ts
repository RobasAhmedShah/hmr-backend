import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import Decimal from 'decimal.js';
import { Reward } from './entities/reward.entity';
import { Investment } from '../investments/entities/investment.entity';
import { Wallet } from '../wallet/entities/wallet.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Property } from '../properties/entities/property.entity';
import { User } from '../admin/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { DistributeRoiDto } from './dto/distribute-roi.dto';
import { PortfolioService } from '../portfolio/portfolio.service';

@Injectable()
export class RewardsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Reward)
    private readonly rewardRepo: Repository<Reward>,
    private readonly portfolioService: PortfolioService, // ADD THIS
  ) {}

  async distributeRoi(dto: DistributeRoiDto) {
    return this.dataSource.transaction(async (manager) => {
      // Fetch property and all active investments for this property
      // Check if propertyId is UUID or displayCode
      const isPropertyUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dto.propertyId);
      
      const property = await manager.findOne(Property, { 
        where: isPropertyUuid ? { id: dto.propertyId } : { displayCode: dto.propertyId } 
      });
      if (!property) {
        throw new Error('Property not found');
      }

      const investments = await manager.find(Investment, {
        where: { propertyId: property.id, status: 'confirmed' },  // Use property.id (UUID)
      });

      if (investments.length === 0) {
        throw new Error('No active investments found for this property');
      }

      const totalRoi = new Decimal(dto.totalRoiUSDT);
      const totalTokens = property.totalTokens as Decimal;
      const rewards: Reward[] = [];

      // Group investments by userId to aggregate rewards per user
      const investmentsByUser = new Map<string, Investment[]>();
      for (const investment of investments) {
        if (!investmentsByUser.has(investment.userId)) {
          investmentsByUser.set(investment.userId, []);
        }
        investmentsByUser.get(investment.userId)!.push(investment);
      }

      // Process rewards per user (aggregate all their investments)
      for (const [userId, userInvestments] of investmentsByUser) {
        // Calculate total ROI share for this user across all their investments
        let totalUserTokens = new Decimal(0);
        for (const investment of userInvestments) {
          totalUserTokens = totalUserTokens.plus(investment.tokensPurchased as Decimal);
        }
        
        const roiShare = totalUserTokens.div(totalTokens).mul(totalRoi);

        // Fetch wallet with lock
        const wallet = await manager
          .createQueryBuilder(Wallet, 'wallet')
          .where('wallet.userId = :userId', { userId })
          .setLock('pessimistic_write')
          .getOne();

        if (!wallet) {
          throw new Error(`Wallet not found for user ${userId}`);
        }

        // Credit wallet.balanceUSDT += roiShare
        wallet.balanceUSDT = (wallet.balanceUSDT as Decimal).plus(roiShare);
        await manager.save(Wallet, wallet);

        // Create one reward record per user (referencing the first investment for backward compatibility)
        const rewardResult = await manager.query('SELECT nextval(\'reward_display_seq\') as nextval');
        const rewardDisplayCode = `RWD-${rewardResult[0].nextval.toString().padStart(6, '0')}`;
        
        const reward = manager.getRepository(Reward).create({
          userId,
          investmentId: userInvestments[0].id, // Reference first investment
          amountUSDT: roiShare,
          type: 'roi',
          description: `ROI distribution for property ${property.title}`,
          status: 'distributed',
          displayCode: rewardDisplayCode,
        });
        const savedReward = await manager.save(Reward, reward);
        rewards.push(savedReward);

        // Get user display name for traceability
        const user = await manager.findOne(User, { where: { id: userId } });
        const userDisplayName = user?.fullName || user?.email || 'Unknown User';
        
        // Get organization display name for traceability
        const organization = await manager.findOne(Organization, { where: { id: property.organizationId } });
        const orgDisplayName = organization?.name || 'Unknown Organization';

        // Create one transaction per user with full traceability
        const txnResult = await manager.query('SELECT nextval(\'transaction_display_seq\') as nextval');
        const txnDisplayCode = `TXN-${txnResult[0].nextval.toString().padStart(6, '0')}`;
        
        const txn = manager.getRepository(Transaction).create({
          userId,
          walletId: wallet.id,
          organizationId: property.organizationId,
          propertyId: property.id,
          type: 'reward',
          amountUSDT: roiShare,
          status: 'completed',
          referenceId: savedReward.id,
          description: `ROI reward for ${property.title}`,
          fromEntity: orgDisplayName,  // Human-readable sender (organization)
          toEntity: userDisplayName,   // Human-readable receiver (user)
          displayCode: txnDisplayCode,
        });
        await manager.save(Transaction, txn);

        // Auto-update portfolio for this user (NEW)
        await this.portfolioService.updateAfterReward(
          userId,
          roiShare,
          manager
        );
      }

      return { rewards, count: rewards.length, totalDistributed: totalRoi.toString() };
    });
  }

  async findAll() {
    return this.rewardRepo.find({ relations: ['user', 'investment'] });
  }

  async findByUserId(userId: string) {
    // Check if userId is UUID or displayCode
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    
    if (isUuid) {
      return this.rewardRepo.find({ where: { userId }, relations: ['investment'] });
    } else {
      // It's a display code, find the user first to get their UUID
      const user = await this.dataSource.getRepository(User).findOne({ where: { displayCode: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return this.rewardRepo.find({ where: { userId: user.id }, relations: ['investment'] });
    }
  }

  async findOne(id: string) {
    return this.rewardRepo.findOne({ where: { id }, relations: ['user', 'investment'] });
  }

  async findByIdOrDisplayCode(idOrCode: string) {
    // Check if it's a UUID format (contains hyphens and is 36 chars)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrCode);
    
    if (isUuid) {
      return this.rewardRepo.findOne({ where: { id: idOrCode }, relations: ['user', 'investment'] });
    } else {
      return this.rewardRepo.findOne({ where: { displayCode: idOrCode }, relations: ['user', 'investment'] });
    }
  }
}
