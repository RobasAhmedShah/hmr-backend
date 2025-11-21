import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { CertificatesService } from '../certificates/certificates.service';
import { Public } from '../common/decorators/public.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../transactions/entities/transaction.entity';

@Controller('api/mobile/certificates')
@Public()
export class MobileCertificatesController {
  constructor(
    private readonly certificatesService: CertificatesService,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
  ) {}

  /**
   * Get transaction certificate
   * GET /api/mobile/certificates/transactions/:transactionId
   */
  @Get('transactions/:transactionId')
  async getTransactionCertificate(
    @Param('transactionId') transactionId: string,
  ) {
    try {
      // Support both UUID and displayCode
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(transactionId);
      let transaction;
      
      if (isUuid) {
        transaction = await this.transactionRepo.findOne({
          where: { id: transactionId },
        });
      } else {
        transaction = await this.transactionRepo.findOne({
          where: { displayCode: transactionId },
        });
      }

      if (!transaction) {
        throw new NotFoundException(`Transaction not found: ${transactionId}`);
      }

      // Use actual transaction ID (UUID) for certificate service
      // The service will load relations and generate certificate if needed
      const actualTransactionId = transaction.id;
      const signedUrl = await this.certificatesService.getTransactionCertificate(actualTransactionId);
      return {
        success: true,
        transactionId: actualTransactionId,
        pdfUrl: signedUrl,
      };
    } catch (error) {
      // Log the error for debugging
      console.error('Certificate API Error:', error);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      // Return more detailed error message
      const errorMessage = error?.message || 'Failed to get transaction certificate';
      throw new NotFoundException(errorMessage);
    }
  }

  /**
   * Get property legal document
   * GET /api/mobile/certificates/properties/:propertyId/legal-document
   */
  @Get('properties/:propertyId/legal-document')
  async getPropertyLegalDocument(@Param('propertyId') propertyId: string) {
    try {
      const pdfUrl = await this.certificatesService.getPropertyLegalDocument(propertyId);
      if (!pdfUrl) {
        throw new NotFoundException('Property legal document not found');
      }
      return {
        success: true,
        propertyId,
        pdfUrl,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('Failed to get property legal document');
    }
  }

  /**
   * Generate portfolio summary certificate
   * GET /api/mobile/certificates/portfolio/:propertyId?userId=xxx
   */
  @Get('portfolio/:propertyId')
  async generatePortfolioSummary(
    @Param('propertyId') propertyId: string,
    @Query('userId') userId?: string,
  ) {
    try {
      // If userId is not provided, we can't generate portfolio summary
      if (!userId) {
        throw new NotFoundException('User ID is required as query parameter: ?userId=xxx');
      }

      const result = await this.certificatesService.generatePortfolioSummary(
        userId,
        propertyId,
      );
      return {
        success: true,
        propertyId,
        pdfUrl: result.signedUrl,
        certificatePath: result.certificatePath,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('Failed to generate portfolio summary certificate');
    }
  }
}
