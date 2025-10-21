import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { Transaction } from './entities/transaction.entity';
import { Wallet } from '../wallet/entities/wallet.entity';
import { User } from '../admin/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { Property } from '../properties/entities/property.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, Wallet, User, Organization, Property])],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService], // Export for use in other modules
})
export class TransactionsModule {}


