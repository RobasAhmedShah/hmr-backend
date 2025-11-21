import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { InvestmentCompletedEvent } from '../events/investment.events';
import { CertificatesService } from '../certificates/certificates.service';
import { Transaction } from '../transactions/entities/transaction.entity';

@Injectable()
export class CertificateListener {
  private readonly logger = new Logger(CertificateListener.name);

  constructor(
    private readonly certificatesService: CertificatesService,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
  ) {}

  /**
   * Auto-generate transaction certificate when investment is completed
   */
  @OnEvent('investment.completed', { async: true })
  async handleInvestmentCompleted(event: InvestmentCompletedEvent) {
    try {
      this.logger.log(
        `[CertificateListener] 📨 Event received for investment: ${event.investmentDisplayCode}, userId: ${event.userId}, propertyId: ${event.propertyId}`,
      );

      // ✅ Add delay to ensure transaction is committed and visible
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Find the transaction for this investment
      // Query the most recent transaction for this user and property
      const transaction = await this.transactionRepo.findOne({
        where: {
          userId: event.userId,
          propertyId: event.propertyId,
          type: 'investment',
          status: 'completed',
        },
        order: { createdAt: 'DESC' },
        relations: ['user', 'property'], // Add relations for debugging
      });

      if (!transaction) {
        this.logger.error(
          `[CertificateListener] ❌ No transaction found for investment ${event.investmentDisplayCode}. ` +
          `Searched for: userId=${event.userId}, propertyId=${event.propertyId}, type=investment, status=completed`,
        );
        
        // Try to find ANY transaction for this user/property for debugging
        const anyTransaction = await this.transactionRepo.find({
          where: {
            userId: event.userId,
            propertyId: event.propertyId,
          },
          order: { createdAt: 'DESC' },
          take: 5,
        });
        
        this.logger.log(
          `[CertificateListener] Found ${anyTransaction.length} transactions for user/property:`,
          anyTransaction.map(t => ({
            id: t.id,
            displayCode: t.displayCode,
            type: t.type,
            status: t.status,
            createdAt: t.createdAt,
          })),
        );
        
        return;
      }

      this.logger.log(
        `[CertificateListener] ✅ Found transaction: ${transaction.displayCode} (${transaction.id})`,
      );

      // Generate certificate asynchronously (don't block)
      this.certificatesService
        .generateTransactionCertificate(transaction.id)
        .then((result) => {
          this.logger.log(
            `[CertificateListener] ✅ Certificate generated successfully for transaction ${transaction.displayCode}: ${result.certificatePath}`,
          );
        })
        .catch((error) => {
          this.logger.error(
            `[CertificateListener] ❌ Failed to generate certificate for transaction ${transaction.id}:`,
            error.stack || error.message || error,
          );
          // Log full error details
          console.error('[CertificateListener] Full error:', error);
          // Don't throw - certificate generation failure shouldn't break the system
        });
    } catch (error) {
      this.logger.error('[CertificateListener] ❌ Failed to handle certificate generation:', error);
      console.error('[CertificateListener] Full error:', error);
      // Don't throw - certificate generation failure shouldn't break the system
    }
  }
}

