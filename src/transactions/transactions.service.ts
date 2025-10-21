import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { User } from '../admin/entities/user.entity';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Transaction)
    private readonly txnRepo: Repository<Transaction>,
  ) {}

  // Get all transactions
  async findAllTransactions() {
    return this.txnRepo.find({
      relations: ['user', 'wallet', 'organization', 'property'],
      order: { createdAt: 'DESC' },
    });
  }

  // Get transactions for a specific user
  async findUserTransactions(userId: string) {
    // Check if userId is UUID or displayCode
    const isUserIdUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

    let actualUserId = userId;
    if (!isUserIdUuid) {
      // Find user by displayCode to get their UUID
      const user = await this.dataSource.getRepository(User).findOne({ where: { displayCode: userId } });
      if (!user) throw new NotFoundException('User not found');
      actualUserId = user.id;
    }

    return this.txnRepo.find({
      where: { userId: actualUserId },
      relations: ['user', 'wallet', 'organization', 'property'],
      order: { createdAt: 'DESC' },
    });
  }
}


