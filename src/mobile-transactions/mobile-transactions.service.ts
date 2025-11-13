import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { TransactionsService } from '../transactions/transactions.service';
import { Transaction } from '../transactions/entities/transaction.entity';
import { TransactionFilterDto } from './dto/transaction-filter.dto';
import Decimal from 'decimal.js';

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class MobileTransactionsService {
  constructor(
    private readonly transactionsService: TransactionsService,
    @InjectRepository(Transaction)
    private readonly txnRepo: Repository<Transaction>,
  ) {}

  async findByUserWithFilters(
    userId: string,
    query: TransactionFilterDto,
  ): Promise<PaginatedResponse<any>> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    // Check if userId is UUID or displayCode
    const isUserIdUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      userId,
    );

    let actualUserId = userId;
    if (!isUserIdUuid) {
      // Find user by displayCode to get their UUID
      const user = await this.txnRepo.manager
        .getRepository('User')
        .findOne({ where: { displayCode: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      actualUserId = user.id;
    }

    // Build query
    let qb = this.txnRepo
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.property', 'property')
      .where('transaction.userId = :userId', { userId: actualUserId });

    // Apply filters
    if (query.type) {
      qb = qb.andWhere('transaction.type = :type', { type: query.type });
    }

    if (query.status) {
      qb = qb.andWhere('transaction.status = :status', { status: query.status });
    }

    if (query.propertyId) {
      // Check if propertyId is UUID or displayCode
      const isPropertyUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        query.propertyId,
      );

      if (isPropertyUuid) {
        qb = qb.andWhere('transaction.propertyId = :propertyId', {
          propertyId: query.propertyId,
        });
      } else {
        // Find property by displayCode
        const property = await this.txnRepo.manager
          .getRepository('Property')
          .findOne({ where: { displayCode: query.propertyId } });
        if (property) {
          qb = qb.andWhere('transaction.propertyId = :propertyId', {
            propertyId: property.id,
          });
        } else {
          // Property not found, return empty result
          qb = qb.andWhere('1 = 0'); // Always false condition
        }
      }
    }

    // Get total count before pagination
    const total = await qb.getCount();

    // Apply pagination and ordering
    const transactions = await qb
      .orderBy('transaction.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    // Transform transactions
    const transformedTransactions = transactions.map((txn) => this.transformTransaction(txn));

    return {
      data: transformedTransactions,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private transformTransaction(transaction: Transaction): any {
    // Map transaction type to mobile app format
    let type: string = transaction.type;
    if (transaction.type === 'reward') {
      type = 'rental_income'; // Map reward to rental_income for mobile
    }

    // Mobile app expects investment transactions to have negative amounts
    // amount: -amount (as per APP_FLOW_DOCUMENTATION.md line 444)
    let amount = (transaction.amountUSDT as Decimal).toNumber();
    if (transaction.type === 'investment') {
      amount = -Math.abs(amount); // Ensure negative for investments
    }

    return {
      id: transaction.id,
      type,
      amount,
      date: transaction.createdAt,
      description: transaction.description || this.generateDescription(transaction),
      status: transaction.status,
      currency: 'USDC',
      propertyId: transaction.propertyId || null,
      propertyTitle: transaction.property?.title || null,
      transactionHash: transaction.displayCode, // Use displayCode as transaction hash
    };
  }

  private generateDescription(transaction: Transaction): string {
    if (transaction.description) {
      return transaction.description;
    }

    const typeMap: Record<string, string> = {
      deposit: 'Wallet deposit',
      withdrawal: 'Withdrawal',
      investment: `Investment in ${transaction.property?.title || 'property'}`,
      return: 'Return on investment',
      fee: 'Transaction fee',
      reward: `Rental income from ${transaction.property?.title || 'property'}`,
      inflow: 'Funds received',
    };

    return typeMap[transaction.type] || 'Transaction';
  }
}

