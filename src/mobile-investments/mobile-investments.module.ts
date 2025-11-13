import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MobileInvestmentsController } from './mobile-investments.controller';
import { MobileInvestmentsService } from './mobile-investments.service';
import { InvestmentsModule } from '../investments/investments.module';

@Module({
  imports: [ConfigModule, InvestmentsModule],
  controllers: [MobileInvestmentsController],
  providers: [MobileInvestmentsService],
  exports: [MobileInvestmentsService],
})
export class MobileInvestmentsModule {}

