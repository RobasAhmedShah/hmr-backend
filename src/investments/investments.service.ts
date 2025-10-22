import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import Decimal from 'decimal.js';
import { Investment } from './entities/investment.entity';
import { Property } from '../properties/entities/property.entity';
import { Wallet } from '../wallet/entities/wallet.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { User } from '../admin/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { InvestDto } from './dto/invest.dto';
import { InvestmentCompletedEvent } from '../events/investment.events';

@Injectable()
export class InvestmentsService {
  private readonly logger = new Logger(InvestmentsService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Investment)
    private readonly investmentRepo: Repository<Investment>,
    private readonly eventEmitter: EventEmitter2, // Event-driven architecture
  ) {}

  async invest(userId: string, propertyId: string, tokensToBuy: Decimal) {
    return this.dataSource.transaction(async (manager) => {
      // Step 1: Fetch and lock property (pessimistic_write)
      // Check if propertyId is UUID or displayCode
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(propertyId);
      
      const property = await manager.findOne(Property, {
        where: isUuid ? { id: propertyId } : { displayCode: propertyId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!property) throw new NotFoundException('Property not found');
      
      // Step 2: Validate availableTokens >= tokensToBuy
      if ((property.availableTokens as Decimal).lt(tokensToBuy)) {
        throw new BadRequestException('Insufficient available tokens');
      }

      // Step 3: Compute amountUSDT = tokensToBuy * pricePerTokenUSDT
      const amountUSDT = (property.pricePerTokenUSDT as Decimal).mul(tokensToBuy);

      // Step 4: Fetch and lock wallet
      // Check if userId is UUID or displayCode
      const isUserIdUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
      
      let actualUserId = userId;
      let user: User;
      if (!isUserIdUuid) {
        // Find user by displayCode to get their UUID
        const foundUser = await manager.findOne(User, { where: { displayCode: userId } });
        if (!foundUser) throw new NotFoundException('User not found');
        user = foundUser;
        actualUserId = user.id;
      } else {
        // Fetch user by UUID
        const foundUser = await manager.findOne(User, { where: { id: userId } });
        if (!foundUser) throw new NotFoundException('User not found');
        user = foundUser;
      }
      
      const wallet = await manager.findOne(Wallet, {
        where: { userId: actualUserId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!wallet) throw new NotFoundException('Wallet not found');
      
      // Step 5: Validate wallet.balanceUSDT >= amountUSDT
      if ((wallet.balanceUSDT as Decimal).lt(amountUSDT)) {
        throw new BadRequestException('Insufficient wallet balance');
      }

      // Step 6: Decrement balances atomically
      wallet.balanceUSDT = (wallet.balanceUSDT as Decimal).minus(amountUSDT);
      property.availableTokens = (property.availableTokens as Decimal).minus(tokensToBuy);
      await manager.save([wallet, property]);

      // Step 7: Insert investment record
      // Generate displayCode for investment
      const invResult = await manager.query('SELECT nextval(\'investment_display_seq\') as nextval');
      const invDisplayCode = `INV-${invResult[0].nextval.toString().padStart(6, '0')}`;
      
      const investment = manager.create(Investment, {
        userId: actualUserId,  // Use actualUserId (UUID) not displayCode
        propertyId: property.id,  // Use property.id (UUID) not displayCode
        tokensPurchased: tokensToBuy,
        amountUSDT,
        status: 'confirmed',
        paymentStatus: 'completed',
        expectedROI: property.expectedROI,
        displayCode: invDisplayCode,
      });
      const savedInvestment = await manager.save(Investment, investment);

      // Step 8: Insert transaction record
      // Generate displayCode for transaction
      const txnResult = await manager.query('SELECT nextval(\'transaction_display_seq\') as nextval');
      const txnDisplayCode = `TXN-${txnResult[0].nextval.toString().padStart(6, '0')}`;
      
      // Step 9: Get organization for event emission
      const organization = await manager.findOne(Organization, {
        where: { id: property.organizationId },
      });
      if (!organization) throw new NotFoundException('Organization not found for property');

      // Step 10: Emit investment completed event AFTER transaction commits
      const investmentEvent: InvestmentCompletedEvent = {
        eventId: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        userId: actualUserId,
        userDisplayCode: user.displayCode,
        propertyId: property.id,
        propertyDisplayCode: property.displayCode,
        organizationId: organization.id,
        organizationDisplayCode: organization.displayCode,
        tokensPurchased: tokensToBuy,
        amountUSDT,
        investmentId: savedInvestment.id,
        investmentDisplayCode: savedInvestment.displayCode,
      };

      // Emit event for listeners to handle portfolio, organization, and transaction updates
      try {
        this.eventEmitter.emit('investment.completed', investmentEvent);
        this.logger.log(`Investment completed event emitted for user ${user.displayCode}`);
      } catch (error) {
        this.logger.error('Failed to emit investment completed event:', error);
        // Don't throw - let the main operation continue
      }

      return savedInvestment;
    });
  }

  async create(dto: CreateInvestmentDto) {
    // Legacy method - convert amountUSDT to tokens for backward compatibility
    // Check if propertyId is UUID or displayCode
    const isPropertyUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dto.propertyId);
    
    const property = await this.dataSource.getRepository(Property).findOne({ 
      where: isPropertyUuid ? { id: dto.propertyId } : { displayCode: dto.propertyId } 
    });
    if (!property) throw new NotFoundException('Property not found');
    
    const amountUSDT = new Decimal(dto.amountUSDT);
    const tokensToBuy = amountUSDT.div(property.pricePerTokenUSDT as Decimal);
    
    return this.invest(dto.userId, dto.propertyId, tokensToBuy);
  }

  async findAll() {
    return this.investmentRepo.find({ relations: ['user', 'property'] });
  }

  async findByUserId(userId: string) {
    // Check if userId is UUID or displayCode
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    
    if (isUuid) {
      return this.investmentRepo.find({ where: { userId }, relations: ['property'] });
    } else {
      // It's a display code, find the user first to get their UUID
      const user = await this.dataSource.getRepository(User).findOne({ where: { displayCode: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return this.investmentRepo.find({ where: { userId: user.id }, relations: ['property'] });
    }
  }

  async findOne(id: string) {
    return this.investmentRepo.findOne({ where: { id }, relations: ['user', 'property'] });
  }

  async findByIdOrDisplayCode(idOrCode: string) {
    // Check if it's a UUID format (contains hyphens and is 36 chars)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrCode);
    
    if (isUuid) {
      return this.investmentRepo.findOne({ where: { id: idOrCode }, relations: ['user', 'property'] });
    } else {
      return this.investmentRepo.findOne({ where: { displayCode: idOrCode }, relations: ['user', 'property'] });
    }
  }
}
