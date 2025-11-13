import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MobileTransactionsController } from './mobile-transactions.controller';
import { MobileTransactionsService } from './mobile-transactions.service';
import { TransactionsModule } from '../transactions/transactions.module';
import { Transaction } from '../transactions/entities/transaction.entity';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Transaction]), TransactionsModule],
  controllers: [MobileTransactionsController],
  providers: [MobileTransactionsService],
  exports: [MobileTransactionsService],
})
export class MobileTransactionsModule {}

