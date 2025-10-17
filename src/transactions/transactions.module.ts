import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { Transaction } from './entities/transaction.entity';
import { Wallet } from '../wallet/entities/wallet.entity';
import { User } from '../admin/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, Wallet, User])],
  controllers: [TransactionsController],
  providers: [TransactionsService],
})
export class TransactionsModule {}


