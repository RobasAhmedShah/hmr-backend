import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import Decimal from 'decimal.js';
import { Wallet } from './entities/wallet.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { User } from '../admin/entities/user.entity';
import { DepositDto } from './dto/deposit.dto';

@Injectable()
export class WalletService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
  ) {}

  async deposit(dto: DepositDto) {
    return this.dataSource.transaction(async (manager) => {
      const wallets = manager.getRepository(Wallet);
      const transactions = manager.getRepository(Transaction);

      // Check if userId is UUID or displayCode
      const isUserIdUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dto.userId);
      
      let actualUserId = dto.userId;
      if (!isUserIdUuid) {
        // Find user by displayCode to get their UUID
        const user = await manager.findOne(User, { where: { displayCode: dto.userId } });
        if (!user) throw new Error('User not found');
        actualUserId = user.id;
      }

      const wallet = await wallets.findOne({ where: { userId: actualUserId } });
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const amount = new Decimal(dto.amountUSDT);
      wallet.balanceUSDT = (wallet.balanceUSDT as Decimal).plus(amount);
      wallet.totalDepositedUSDT = (wallet.totalDepositedUSDT as Decimal).plus(amount);
      await wallets.save(wallet);

      // Generate displayCode for transaction
      const txnResult = await transactions.query('SELECT nextval(\'transaction_display_seq\') as nextval');
      const txnDisplayCode = `TXN-${txnResult[0].nextval.toString().padStart(6, '0')}`;
      
      const txn = transactions.create({
        userId: actualUserId,  // Use actualUserId (UUID) not displayCode
        walletId: wallet.id,
        type: 'deposit',
        amountUSDT: amount,
        status: 'completed',
        description: 'User deposit',
        displayCode: txnDisplayCode,
      });
      await transactions.save(txn);

      return { wallet, transaction: txn };
    });
  }

  async findByUserId(userId: string) {
    // Check if userId is UUID or displayCode
    const isUserIdUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    
    if (isUserIdUuid) {
      return this.walletRepo.findOne({ where: { userId } });
    } else {
      // Find user by displayCode to get their UUID, then find wallet
      const user = await this.dataSource.getRepository(User).findOne({ where: { displayCode: userId } });
      if (!user) return null;
      return this.walletRepo.findOne({ where: { userId: user.id } });
    }
  }

  async findAll() {
    return this.walletRepo.find({ relations: ['user'] });
  }
}
