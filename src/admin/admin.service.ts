import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import Decimal from 'decimal.js';
import { User } from './entities/user.entity';
import { Wallet } from '../wallet/entities/wallet.entity';
import { KycVerification } from '../kyc/entities/kyc-verification.entity';
import { Portfolio } from '../portfolio/entities/portfolio.entity';
import { UserCreatedEvent } from '../events/user.events';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
    private readonly eventEmitter: EventEmitter2, // Event-driven architecture
  ) {}

  findAll() {
    return this.userRepository.find();
  }

  async create(data: Partial<User>) {
    if (!data) {
      throw new Error('User data is required');
    }
    
    return this.dataSource.transaction(async (manager) => {
      const users = manager.getRepository(User);
      const wallets = manager.getRepository(Wallet);
      const kycRepo = manager.getRepository(KycVerification);
      const portfolioRepo = manager.getRepository(Portfolio);
      
      // Generate displayCode using sequence
      const result = await users.query('SELECT nextval(\'user_display_seq\') as nextval');
      const displayCode = `USR-${result[0].nextval.toString().padStart(6, '0')}`;
      
      // Step 1: Create user
      const user = users.create({
        fullName: data.fullName ?? (data as any).name ?? 'Unknown User',
        email: data.email ?? 'unknown@example.com',
        phone: (data as any).phone ?? null,
        role: (data.role as any) ?? 'user',
        isActive: (data as any).isActive ?? true,
        displayCode,
      });
      const saved = await users.save(user);
      
      // Step 2: Create wallet (existing functionality)
      const wallet = wallets.create({ 
        userId: saved.id,
        balanceUSDT: new Decimal(0),
        lockedUSDT: new Decimal(0),
        totalDepositedUSDT: new Decimal(0),
        totalWithdrawnUSDT: new Decimal(0),
      });
      await wallets.save(wallet);
      
      // Step 3: Create KYC verification record with "pending" status
      const kyc = kycRepo.create({
        userId: saved.id,
        type: 'cnic', // Default type
        status: 'pending', // Default status as requested
        documentFrontUrl: '', // Empty, to be filled later
        submittedAt: new Date(), // Mark as submitted for tracking
      });
      await kycRepo.save(kyc);
      
      // Step 4: Create portfolio record with default values
      const portfolio = portfolioRepo.create({
        userId: saved.id,
        totalInvestedUSDT: new Decimal(0),
        totalRewardsUSDT: new Decimal(0),
        totalROIUSDT: new Decimal(0),
        activeInvestments: 0,
        lastUpdated: new Date(),
      });
      await portfolioRepo.save(portfolio);
      
      // Emit user created event for audit/logging
      const userCreatedEvent: UserCreatedEvent = {
        eventId: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        userId: saved.id,
        userDisplayCode: saved.displayCode,
        fullName: saved.fullName,
        email: saved.email,
        phone: saved.phone || undefined,
        role: saved.role,
        walletId: wallet.id,
        kycId: kyc.id,
        portfolioId: portfolio.id,
      };

      try {
        this.eventEmitter.emit('user.created', userCreatedEvent);
        this.logger.log(`User created event emitted for ${saved.displayCode}`);
      } catch (error) {
        this.logger.error('Failed to emit user created event:', error);
        // Don't throw - let the main operation continue
      }
      
      return saved;
    });
  }
}


