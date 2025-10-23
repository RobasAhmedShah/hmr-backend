import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminAnalyticsController } from './admin-analytics.controller';
import { AdminAnalyticsService } from './admin-analytics.service';
import { User } from '../entities/user.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { Property } from '../../properties/entities/property.entity';
import { Investment } from '../../investments/entities/investment.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { Reward } from '../../rewards/entities/reward.entity';
import { KycVerification } from '../../kyc/entities/kyc-verification.entity';
import { Wallet } from '../../wallet/entities/wallet.entity';
import { PaymentMethod } from '../../payment-methods/entities/payment-method.entity';
import { Portfolio } from '../../portfolio/entities/portfolio.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Organization,
      Property,
      Investment,
      Transaction,
      Reward,
      KycVerification,
      Wallet,
      PaymentMethod,
      Portfolio,
    ]),
  ],
  controllers: [AdminAnalyticsController],
  providers: [AdminAnalyticsService],
  exports: [AdminAnalyticsService],
})
export class AdminAnalyticsModule {}
