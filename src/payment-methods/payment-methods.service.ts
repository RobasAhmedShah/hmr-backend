import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaymentMethod } from './entities/payment-method.entity';
import { CardDetails } from './entities/card-details.entity';
import { User } from '../admin/entities/user.entity';
import { KycVerification } from '../kyc/entities/kyc-verification.entity';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { VerifyPaymentMethodDto } from './dto/verify-payment-method.dto';
import { DepositWithPaymentDto } from './dto/deposit-with-payment.dto';
import { SetDefaultPaymentDto } from './dto/set-default-payment.dto';
import { PaymentMethodCreatedEvent, PaymentMethodVerifiedEvent, WalletDepositInitiatedEvent, WalletFundedEvent } from '../events/payment.events';
import { WalletService } from '../wallet/wallet.service';
import Decimal from 'decimal.js';

@Injectable()
export class PaymentMethodsService {
  private readonly logger = new Logger(PaymentMethodsService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodRepo: Repository<PaymentMethod>,
    @InjectRepository(CardDetails)
    private readonly cardDetailsRepo: Repository<CardDetails>,
    private readonly eventEmitter: EventEmitter2, // Event-driven architecture
    private readonly walletService: WalletService, // For synchronous deposit processing
  ) {}

  async create(dto: CreatePaymentMethodDto) {
    return this.dataSource.transaction(async (manager) => {
      // Check if userId is UUID or displayCode
      const isUserIdUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dto.userId);
      
      let actualUserId = dto.userId;
      if (!isUserIdUuid) {
        // Find user by displayCode to get their UUID
        const user = await manager.findOne(User, { where: { displayCode: dto.userId } });
        if (!user) throw new NotFoundException('User not found');
        actualUserId = user.id;
      }

      // Check if user exists
      const user = await manager.findOne(User, { where: { id: actualUserId } });
      if (!user) throw new NotFoundException('User not found');

      // Check if user has verified KYC
      const kyc = await manager.findOne(KycVerification, { where: { userId: actualUserId } });
      if (!kyc || kyc.status !== 'verified') {
        throw new BadRequestException('User must have verified KYC to add payment methods');
      }

      // Validate card details for card type payment methods
      if (dto.type === 'card' && !dto.cardDetails) {
        throw new BadRequestException('Card details are required for card type payment methods');
      }

      // If setting as default, unset other default payment methods for this user
      if (dto.isDefault) {
        await manager.update(PaymentMethod, 
          { userId: actualUserId, isDefault: true }, 
          { isDefault: false }
        );
      }

      // Create payment method - automatically verified for instant use
      const paymentMethod = manager.create(PaymentMethod, {
        userId: actualUserId,
        type: dto.type,
        provider: dto.provider,
        status: 'verified', // Automatically verified - no verification step needed
        isDefault: dto.isDefault || false,
      });

      const savedPaymentMethod = await manager.save(PaymentMethod, paymentMethod);

      // Create card details if provided
      if (dto.type === 'card' && dto.cardDetails) {
        const cardDetails = manager.create(CardDetails, {
          paymentMethodId: savedPaymentMethod.id,
          cardNumber: dto.cardDetails.cardNumber,
          cardholderName: dto.cardDetails.cardholderName,
          expiryMonth: dto.cardDetails.expiryMonth,
          expiryYear: dto.cardDetails.expiryYear,
          cvv: dto.cardDetails.cvv,
          cardType: dto.cardDetails.cardType,
          cardCategory: dto.cardDetails.cardCategory,
          billingAddress: dto.cardDetails.billingAddress,
          billingCity: dto.cardDetails.billingCity,
          billingState: dto.cardDetails.billingState,
          billingPostalCode: dto.cardDetails.billingPostalCode,
          billingCountry: dto.cardDetails.billingCountry,
          issuingBank: dto.cardDetails.issuingBank,
          bankCode: dto.cardDetails.bankCode,
          token: dto.cardDetails.token,
          isTokenized: dto.cardDetails.isTokenized || false,
        });

        await manager.save(CardDetails, cardDetails);
      }

      // Emit payment method created event
      const paymentMethodCreatedEvent: PaymentMethodCreatedEvent = {
        eventId: `pm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        userId: actualUserId,
        userDisplayCode: user.displayCode,
        methodId: savedPaymentMethod.id,
        methodType: savedPaymentMethod.type,
        provider: savedPaymentMethod.provider,
        status: savedPaymentMethod.status,
      };

      try {
        this.eventEmitter.emit('paymentMethod.created', paymentMethodCreatedEvent);
        this.logger.log(`Payment method created event emitted for user ${user.displayCode}`);
      } catch (error) {
        this.logger.error('Failed to emit payment method created event:', error);
        // Don't throw - let the main operation continue
      }

      return savedPaymentMethod;
    });
  }

  async verify(id: string, dto: VerifyPaymentMethodDto) {
    return this.dataSource.transaction(async (manager) => {
      const paymentMethod = await manager.findOne(PaymentMethod, {
        where: { id },
        relations: ['user'],
      });

      if (!paymentMethod) {
        throw new NotFoundException('Payment method not found');
      }

      paymentMethod.status = dto.status;
      const updatedPaymentMethod = await manager.save(PaymentMethod, paymentMethod);

      // Emit payment method verified event
      const paymentMethodVerifiedEvent: PaymentMethodVerifiedEvent = {
        eventId: `pmv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        userId: paymentMethod.userId,
        userDisplayCode: paymentMethod.user.displayCode,
        methodId: updatedPaymentMethod.id,
        methodType: updatedPaymentMethod.type,
        provider: updatedPaymentMethod.provider,
      };

      try {
        this.eventEmitter.emit('paymentMethod.verified', paymentMethodVerifiedEvent);
        this.logger.log(`Payment method verified event emitted for user ${paymentMethod.user.displayCode}`);
      } catch (error) {
        this.logger.error('Failed to emit payment method verified event:', error);
        // Don't throw - let the main operation continue
      }

      return updatedPaymentMethod;
    });
  }

  async findByUserId(userId: string) {
    // Check if userId is UUID or displayCode
    const isUserIdUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    
    if (isUserIdUuid) {
      return this.paymentMethodRepo.find({ 
        where: { userId },
        relations: ['cardDetails'],
        order: { isDefault: 'DESC', createdAt: 'ASC' }
      });
    } else {
      // Find user by displayCode to get their UUID, then find payment methods
      const user = await this.dataSource.getRepository(User).findOne({ where: { displayCode: userId } });
      if (!user) return [];
      return this.paymentMethodRepo.find({ 
        where: { userId: user.id },
        relations: ['cardDetails'],
        order: { isDefault: 'DESC', createdAt: 'ASC' }
      });
    }
  }

  async findOne(id: string) {
    return this.paymentMethodRepo.findOne({ 
      where: { id }, 
      relations: ['user', 'cardDetails'] 
    });
  }

  async setDefault(id: string, dto: SetDefaultPaymentDto) {
    return this.dataSource.transaction(async (manager) => {
      const paymentMethod = await manager.findOne(PaymentMethod, { 
        where: { id },
        relations: ['user']
      });
      
      if (!paymentMethod) {
        throw new NotFoundException('Payment method not found');
      }

      if (dto.isDefault) {
        // Unset other default payment methods for this user
        await manager.update(PaymentMethod, 
          { userId: paymentMethod.userId, isDefault: true }, 
          { isDefault: false }
        );
      }

      // Set the new default status
      paymentMethod.isDefault = dto.isDefault;
      return manager.save(PaymentMethod, paymentMethod);
    });
  }

  async remove(id: string) {
    const paymentMethod = await this.paymentMethodRepo.findOne({ where: { id } });
    if (!paymentMethod) {
      throw new NotFoundException('Payment method not found');
    }

    // Soft delete by setting status to disabled
    paymentMethod.status = 'disabled';
    return this.paymentMethodRepo.save(paymentMethod);
  }

  async initiateDeposit(dto: DepositWithPaymentDto) {
    return this.dataSource.transaction(async (manager) => {
      // Check if userId is UUID or displayCode
      const isUserIdUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dto.userId);
      
      let actualUserId = dto.userId;
      if (!isUserIdUuid) {
        // Find user by displayCode to get their UUID
        const user = await manager.findOne(User, { where: { displayCode: dto.userId } });
        if (!user) throw new NotFoundException('User not found');
        actualUserId = user.id;
      }

      // Get user
      const user = await manager.findOne(User, { where: { id: actualUserId } });
      if (!user) throw new NotFoundException('User not found');

      // Check if user has verified KYC before allowing deposits
      const kyc = await manager.findOne(KycVerification, { where: { userId: actualUserId } });
      if (!kyc || kyc.status !== 'verified') {
        throw new BadRequestException('User must have verified KYC to make deposits');
      }

      let paymentMethod: PaymentMethod | null = null;
      let methodId: string | undefined = undefined;
      let methodType: 'card' | 'bank' | 'crypto' | undefined = undefined;
      let provider: string | undefined = undefined;

      // Payment method is optional - if provided, use it; otherwise deposit without saved payment method
      if (dto.methodId) {
        paymentMethod = await manager.findOne(PaymentMethod, { where: { id: dto.methodId } });
        if (!paymentMethod) throw new NotFoundException('Payment method not found');
        
        // If payment method is provided, it should be verified
        if (paymentMethod.status !== 'verified') {
          throw new BadRequestException('Payment method must be verified to use for deposits');
        }
        
        methodId = paymentMethod.id;
        methodType = paymentMethod.type as 'card' | 'bank' | 'crypto';
        provider = paymentMethod.provider;
      }

      const amount = new Decimal(dto.amountUSDT);

      // Process deposit synchronously and wait for completion
      const result = await this.walletService.processDepositSynchronously({
        userId: actualUserId,
        userDisplayCode: user.displayCode,
        amountUSDT: amount,
        methodId: methodId,
        methodType: methodType,
        provider: provider,
      });

      this.logger.log(`Wallet deposit processed successfully for user ${user.displayCode}`);

      return result;
    });
  }
}
