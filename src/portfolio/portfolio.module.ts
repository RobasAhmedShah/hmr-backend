import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';
import { Portfolio } from './entities/portfolio.entity';
import { User } from '../admin/entities/user.entity';
import { Investment } from '../investments/entities/investment.entity';
import { Reward } from '../rewards/entities/reward.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Portfolio, User, Investment, Reward])],
  controllers: [PortfolioController],
  providers: [PortfolioService],
  exports: [PortfolioService], // EXPORT for use in other modules
})
export class PortfolioModule {}


