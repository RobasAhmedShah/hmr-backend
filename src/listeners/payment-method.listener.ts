import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { DataSource, Repository, EntityManager } from 'typeorm';
import { PaymentMethod } from '../payment-methods/entities/payment-method.entity';
import { User } from '../admin/entities/user.entity';
import type { UserCreatedEvent } from '../events/user.events';
import type { KycVerifiedEvent } from '../events/kyc.events';

@Injectable()
export class PaymentMethodListener {
  private readonly logger = new Logger(PaymentMethodListener.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodRepo: Repository<PaymentMethod>,
  ) {}

  /**
   * Handle user created event - create empty payment method record (status: pending)
   */
  @OnEvent('user.created', { async: true })
  async handleUserCreated(event: UserCreatedEvent) {
    try {
      this.logger.log(`Creating pending payment method for user ${event.userDisplayCode}`);

      // Async listener - create new transaction
      await this.dataSource.transaction(async (manager) => {
        await this.createPendingPaymentMethodInTransaction(event.userId, manager);
      });

      this.logger.log(`Pending payment method created for user ${event.userDisplayCode}`);
    } catch (error) {
      this.logger.error(`Failed to create pending payment method for user ${event.userDisplayCode}:`, error);
      // Don't throw - let the main operation continue
    }
  }

  /**
   * Handle KYC verified event - enable payment method linking for that user
   */
  @OnEvent('kyc.verified', { async: true })
  async handleKycVerified(event: KycVerifiedEvent) {
    try {
      this.logger.log(`KYC verified for user ${event.userDisplayCode} - payment method linking enabled`);

      // Async listener - create new transaction
      await this.dataSource.transaction(async (manager) => {
        await this.enablePaymentMethodLinkingInTransaction(event.userId, manager);
      });

      this.logger.log(`Payment method linking enabled for user ${event.userDisplayCode}`);
    } catch (error) {
      this.logger.error(`Failed to enable payment method linking for user ${event.userDisplayCode}:`, error);
      // Don't throw - let the main operation continue
    }
  }

  /**
   * Create pending payment method record for new user
   */
  private async createPendingPaymentMethodInTransaction(
    userId: string,
    manager: EntityManager,
  ) {
    // Check if payment method already exists
    const existingPaymentMethod = await manager.findOne(PaymentMethod, {
      where: { userId },
    });

    if (existingPaymentMethod) {
      this.logger.log(`Payment method already exists for user ${userId}`);
      return;
    }

    // Create pending payment method
    const paymentMethod = manager.create(PaymentMethod, {
      userId,
      type: 'card', // Default type
      provider: 'Pending Verification',
      status: 'pending',
      isDefault: false,
    });

    await manager.save(PaymentMethod, paymentMethod);
  }

  /**
   * Enable payment method linking after KYC verification
   */
  private async enablePaymentMethodLinkingInTransaction(
    userId: string,
    manager: EntityManager,
  ) {
    // Update any pending payment methods to allow linking
    const pendingPaymentMethods = await manager.find(PaymentMethod, {
      where: { userId, status: 'pending' },
    });

    for (const paymentMethod of pendingPaymentMethods) {

      if (paymentMethod.provider === 'Pending Verification') {
        // This is the auto-created one, we can update its provider to indicate KYC is verified
        paymentMethod.provider = 'Ready for Card Details';
        await manager.save(PaymentMethod, paymentMethod);
      }
    }
  }
}
