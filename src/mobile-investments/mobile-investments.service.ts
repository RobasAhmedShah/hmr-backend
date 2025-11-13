import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InvestmentsService } from '../investments/investments.service';
import { Investment } from '../investments/entities/investment.entity';
import Decimal from 'decimal.js';

@Injectable()
export class MobileInvestmentsService {
  constructor(private readonly investmentsService: InvestmentsService) {}

  async create(userId: string, propertyId: string, tokenCount: number): Promise<any> {
    // Use existing invest method
    const investment = await this.investmentsService.invest(
      userId,
      propertyId,
      new Decimal(tokenCount),
    );

    return this.transformInvestment(investment);
  }

  async findByUserId(userId: string): Promise<any[]> {
    const investments = await this.investmentsService.findByUserId(userId);
    return investments.map((inv) => this.transformInvestment(inv));
  }

  async findOne(id: string, userId?: string): Promise<any> {
    const investment = await this.investmentsService.findByIdOrDisplayCode(id);

    if (!investment) {
      throw new NotFoundException(`Investment with id or displayCode '${id}' not found`);
    }

    // If userId is provided, verify ownership
    if (userId && investment.userId !== userId) {
      throw new ForbiddenException('You do not have access to this investment');
    }

    return this.transformInvestment(investment);
  }

  private transformInvestment(investment: Investment): any {
    // Calculate current value (tokens * current token price * 1.15)
    // Mobile app expects: currentValue = tokensPurchased × property.tokenPrice × 1.15
    // 1.15 = 15% growth estimate (matching mobile app calculation)
    const baseValue = investment.tokensPurchased.mul(
      investment.property?.pricePerTokenUSDT || new Decimal(0),
    );
    const currentValue = baseValue.mul(1.15); // Apply 15% growth multiplier

    // Calculate ROI percentage
    const investedAmount = investment.amountUSDT;
    const roiDecimal = investedAmount.gt(0)
      ? currentValue.minus(investedAmount).div(investedAmount).mul(100)
      : new Decimal(0);

    // Calculate rental yield (using property's expectedROI)
    const rentalYield = investment.property?.expectedROI || investment.expectedROI || new Decimal(0);

    // Calculate monthly rental income
    // Mobile app expects: monthlyRentalIncome = (currentValue × property.estimatedYield / 100) / 12
    const annualIncome = currentValue.mul(rentalYield).div(100);
    const monthlyRentalIncome = annualIncome.div(12);

    return {
      id: investment.id,
      displayCode: investment.displayCode,
      property: investment.property
        ? {
            id: investment.property.id,
            displayCode: investment.property.displayCode,
            title: investment.property.title,
            images: this.extractImages(investment.property.images),
            tokenPrice: investment.property.pricePerTokenUSDT.toNumber(),
            status: investment.property.status,
            city: investment.property.city,
            country: investment.property.country,
          }
        : null,
      tokens: investment.tokensPurchased.toNumber(),
      investedAmount: investment.amountUSDT.toNumber(),
      currentValue: currentValue.toNumber(),
      roi: roiDecimal.toNumber(),
      rentalYield: rentalYield.toNumber(),
      monthlyRentalIncome: monthlyRentalIncome.toNumber(),
      status: investment.status,
      paymentStatus: investment.paymentStatus,
      purchaseDate: investment.createdAt,
      createdAt: investment.createdAt,
      updatedAt: investment.updatedAt,
    };
  }

  private extractImages(images: any): string[] {
    if (!images) return [];
    if (Array.isArray(images)) {
      return images.map((img) => (typeof img === 'string' ? img : img.url || '')).filter(Boolean);
    }
    return [];
  }
}

