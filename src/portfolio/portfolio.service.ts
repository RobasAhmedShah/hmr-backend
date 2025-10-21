import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import Decimal from 'decimal.js';
import { Portfolio } from './entities/portfolio.entity';
import { Investment } from '../investments/entities/investment.entity';
import { Reward } from '../rewards/entities/reward.entity';
import { User } from '../admin/entities/user.entity';

@Injectable()
export class PortfolioService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Portfolio)
    private readonly portfolioRepo: Repository<Portfolio>,
    @InjectRepository(Investment)
    private readonly investmentRepo: Repository<Investment>,
    @InjectRepository(Reward)
    private readonly rewardRepo: Repository<Reward>,
  ) {}

  // Auto-update method called by InvestmentService
  async updateAfterInvestment(userId: string, amountUSDT: Decimal, transactionManager: EntityManager) {
    const portfolio = await transactionManager.findOne(Portfolio, { where: { userId } });
    if (!portfolio) return;
    
    portfolio.totalInvestedUSDT = (portfolio.totalInvestedUSDT as Decimal).plus(amountUSDT);
    portfolio.activeInvestments += 1;
    portfolio.lastUpdated = new Date();
    await transactionManager.save(Portfolio, portfolio);
  }

  // Auto-update method called by RewardService
  async updateAfterReward(userId: string, rewardUSDT: Decimal, transactionManager: EntityManager) {
    const portfolio = await transactionManager.findOne(Portfolio, { where: { userId } });
    if (!portfolio) return;
    
    portfolio.totalRewardsUSDT = (portfolio.totalRewardsUSDT as Decimal).plus(rewardUSDT);
    portfolio.totalROIUSDT = (portfolio.totalROIUSDT as Decimal).plus(rewardUSDT);
    portfolio.lastUpdated = new Date();
    await transactionManager.save(Portfolio, portfolio);
  }

  // GET endpoint method - comprehensive portfolio for specific user
  async getDetailedPortfolio(userId: string) {
    // Check if userId is UUID or displayCode
    const isUserIdUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

    let actualUserId = userId;
    let user: User;
    if (!isUserIdUuid) {
      // Find user by displayCode to get their UUID
      const foundUser = await this.dataSource.getRepository(User).findOne({ where: { displayCode: userId } });
      if (!foundUser) throw new NotFoundException('User not found');
      user = foundUser;
      actualUserId = user.id;
    } else {
      // Fetch user by UUID
      const foundUser = await this.dataSource.getRepository(User).findOne({ where: { id: userId } });
      if (!foundUser) throw new NotFoundException('User not found');
      user = foundUser;
    }

    // Get portfolio
    const portfolio = await this.portfolioRepo.findOne({ where: { userId: actualUserId } });
    if (!portfolio) throw new NotFoundException('Portfolio not found');

    // Get all investments with property details
    const investments = await this.investmentRepo.find({
      where: { userId: actualUserId },
      relations: ['property', 'property.organization'],
      order: { createdAt: 'DESC' }
    });

    // Get all rewards
    const rewards = await this.rewardRepo.find({
      where: { userId: actualUserId },
      relations: ['investment', 'investment.property'],
      order: { createdAt: 'DESC' }
    });

    // Calculate detailed investment data
    const investmentDetails = investments.map(investment => {
      const currentValue = (investment.tokensPurchased as Decimal).mul(investment.property.pricePerTokenUSDT as Decimal);
      const totalRewards = rewards
        .filter(reward => reward.investmentId === investment.id)
        .reduce((sum, reward) => sum.plus(reward.amountUSDT as Decimal), new Decimal(0));
      
      return {
        investmentId: investment.id,
        displayCode: investment.displayCode,
        property: {
          id: investment.property.id,
          displayCode: investment.property.displayCode,
          title: investment.property.title,
          slug: investment.property.slug,
          type: investment.property.type,
          status: investment.property.status,
          city: investment.property.city,
          country: investment.property.country,
          organization: {
            id: investment.property.organization.id,
            displayCode: investment.property.organization.displayCode,
            name: investment.property.organization.name,
          }
        },
        tokensPurchased: investment.tokensPurchased.toString(),
        amountInvestedUSDT: investment.amountUSDT.toString(),
        currentValueUSDT: currentValue.toString(),
        expectedROI: investment.expectedROI.toString(),
        totalRewardsUSDT: totalRewards.toString(),
        netROI: totalRewards.minus(investment.amountUSDT as Decimal).toString(),
        status: investment.status,
        paymentStatus: investment.paymentStatus,
        investedAt: investment.createdAt,
        lastUpdated: investment.updatedAt,
      };
    });

    // Calculate summary statistics
    const totalInvested = investments.reduce((sum, inv) => sum.plus(inv.amountUSDT as Decimal), new Decimal(0));
    const totalRewards = rewards.reduce((sum, reward) => sum.plus(reward.amountUSDT as Decimal), new Decimal(0));
    const totalCurrentValue = investmentDetails.reduce((sum, inv) => sum.plus(new Decimal(inv.currentValueUSDT)), new Decimal(0));
    const totalNetROI = totalRewards.minus(totalInvested);

    return {
      user: {
        id: user.id,
        displayCode: user.displayCode,
        fullName: user.fullName,
        email: user.email,
      },
      portfolio: {
        id: portfolio.id,
        totalInvestedUSDT: portfolio.totalInvestedUSDT.toString(),
        totalRewardsUSDT: portfolio.totalRewardsUSDT.toString(),
        totalROIUSDT: portfolio.totalROIUSDT.toString(),
        activeInvestments: portfolio.activeInvestments,
        lastUpdated: portfolio.lastUpdated,
        createdAt: portfolio.createdAt,
      },
      summary: {
        totalInvestedUSDT: totalInvested.toString(),
        totalRewardsUSDT: totalRewards.toString(),
        totalCurrentValueUSDT: totalCurrentValue.toString(),
        totalNetROI: totalNetROI.toString(),
        totalInvestments: investments.length,
        activeInvestments: investments.filter(inv => inv.status === 'confirmed' || inv.status === 'active').length,
        averageROI: investments.length > 0 ? 
          investments.reduce((sum, inv) => sum.plus(inv.expectedROI as Decimal), new Decimal(0)).div(investments.length).toString() : '0',
      },
      investments: investmentDetails,
      rewards: rewards.map(reward => ({
        id: reward.id,
        displayCode: reward.displayCode,
        amountUSDT: reward.amountUSDT.toString(),
        type: reward.type,
        description: reward.description,
        status: reward.status,
        createdAt: reward.createdAt,
        property: {
          title: reward.investment.property.title,
          displayCode: reward.investment.property.displayCode,
        }
      })),
    };
  }
}


