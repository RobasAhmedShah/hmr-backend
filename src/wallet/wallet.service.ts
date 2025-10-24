import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { DataSource, Repository, EntityManager } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import Decimal from 'decimal.js';
import { Wallet } from './entities/wallet.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { User } from '../admin/entities/user.entity';
import { KycVerification } from '../kyc/entities/kyc-verification.entity';
import { DepositDto } from './dto/deposit.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { WalletCreditedEvent } from '../events/wallet.events';
import type { WalletDepositInitiatedEvent, WalletFundedEvent } from '../events/payment.events';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
    private readonly eventEmitter: EventEmitter2, // Event-driven architecture
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

      // Check if user has verified KYC before allowing deposits
      const kyc = await manager.findOne(KycVerification, { where: { userId: actualUserId } });
      if (!kyc || kyc.status !== 'verified') {
        throw new Error('User must have verified KYC to make deposits');
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

      // Emit wallet credited event for audit/logging
      const walletCreditedEvent: WalletCreditedEvent = {
        eventId: `wal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        userId: actualUserId,
        userDisplayCode: dto.userId, // Original input (could be displayCode)
        walletId: wallet.id,
        amountUSDT: amount,
        newBalanceUSDT: wallet.balanceUSDT as Decimal,
        transactionId: txn.id,
        transactionDisplayCode: txnDisplayCode,
        description: 'User deposit',
      };

      try {
        this.eventEmitter.emit('wallet.credited', walletCreditedEvent);
        this.logger.log(`Wallet credited event emitted for user ${dto.userId}`);
      } catch (error) {
        this.logger.error('Failed to emit wallet credited event:', error);
        // Don't throw - let the main operation continue
      }

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

  /**
   * Handle wallet deposit initiated event - process the deposit
   */
  @OnEvent('wallet.deposit_initiated', { async: true })
  async handleDepositInitiated(event: WalletDepositInitiatedEvent) {
    try {
      this.logger.log(`Processing wallet deposit for user ${event.userDisplayCode}`);

      // Async listener - create new transaction
      await this.dataSource.transaction(async (manager) => {
        await this.processDepositInTransaction(event, manager);
      });

      this.logger.log(`Wallet deposit processed for user ${event.userDisplayCode}`);
    } catch (error) {
      this.logger.error(`Failed to process wallet deposit for user ${event.userDisplayCode}:`, error);
      // Don't throw - let the main operation continue
    }
  }

  /**
   * Process deposit in transaction
   */
  private async processDepositInTransaction(
    event: WalletDepositInitiatedEvent,
    manager: EntityManager,
  ) {
    const wallets = manager.getRepository(Wallet);
    const transactions = manager.getRepository(Transaction);
    const users = manager.getRepository(User);

    // Get user and wallet
    const user = await users.findOne({ where: { id: event.userId } });
    if (!user) throw new Error('User not found');

    // KYC verification is now checked in the main service before emitting the event

    const wallet = await wallets.findOne({ where: { userId: event.userId } });
    if (!wallet) throw new Error('Wallet not found');

    // Update wallet balance
    wallet.balanceUSDT = (wallet.balanceUSDT as Decimal).plus(event.amountUSDT);
    wallet.totalDepositedUSDT = (wallet.totalDepositedUSDT as Decimal).plus(event.amountUSDT);
    await wallets.save(wallet);

    // Generate displayCode for transaction
    const txnResult = await transactions.query('SELECT nextval(\'transaction_display_seq\') as nextval');
    const txnDisplayCode = `TXN-${txnResult[0].nextval.toString().padStart(6, '0')}`;

    const txn = transactions.create({
      userId: event.userId,
      walletId: wallet.id,
      paymentMethodId: event.methodId,
      type: 'deposit',
      amountUSDT: event.amountUSDT,
      status: 'completed',
      description: `Deposit via ${event.provider} ${event.methodType}`,
      displayCode: txnDisplayCode,
    });
    const savedTxn = await transactions.save(txn);

    // Emit wallet funded event
    const walletFundedEvent: WalletFundedEvent = {
      eventId: `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      userId: event.userId,
      userDisplayCode: event.userDisplayCode,
      amountUSDT: event.amountUSDT,
      transactionId: savedTxn.id,
      transactionDisplayCode: txnDisplayCode,
      methodId: event.methodId,
      methodType: event.methodType,
      provider: event.provider,
    };

    try {
      this.eventEmitter.emit('wallet.funded', walletFundedEvent);
      this.logger.log(`Wallet funded event emitted for user ${event.userDisplayCode}`);
    } catch (error) {
      this.logger.error('Failed to emit wallet funded event:', error);
      // Don't throw - let the main operation continue
    }
  }

  async findByIdOrDisplayCode(id: string): Promise<Wallet | null> {
    // Check if id is UUID or displayCode (for user lookup)
    const isIdUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    if (isIdUuid) {
      // Direct wallet ID lookup
      return this.walletRepo.findOne({ where: { id } });
    } else {
      // Find user by displayCode, then find their wallet
      const user = await this.dataSource.getRepository(User).findOne({ where: { displayCode: id } });
      if (!user) return null;
      return this.walletRepo.findOne({ where: { userId: user.id } });
    }
  }

  async update(id: string, dto: UpdateWalletDto): Promise<Wallet> {
    const wallet = await this.findByIdOrDisplayCode(id);
    if (!wallet) {
      throw new NotFoundException(`Wallet with id or user displayCode '${id}' not found`);
    }

    const updateData: Partial<Wallet> = {};

    // Update only provided fields
    if (dto.balanceUSDT !== undefined) updateData.balanceUSDT = new Decimal(dto.balanceUSDT);
    if (dto.lockedUSDT !== undefined) updateData.lockedUSDT = new Decimal(dto.lockedUSDT);
    if (dto.totalDepositedUSDT !== undefined) updateData.totalDepositedUSDT = new Decimal(dto.totalDepositedUSDT);
    if (dto.totalWithdrawnUSDT !== undefined) updateData.totalWithdrawnUSDT = new Decimal(dto.totalWithdrawnUSDT);

    await this.walletRepo.update(wallet.id, updateData);
    const updatedWallet = await this.findByIdOrDisplayCode(id);
    if (!updatedWallet) {
      throw new NotFoundException(`Wallet with id or user displayCode '${id}' not found after update`);
    }
    return updatedWallet;
  }
}
