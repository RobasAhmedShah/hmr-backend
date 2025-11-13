import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PaymentMethodsService } from '../payment-methods/payment-methods.service';
import { CreatePaymentMethodDto } from '../payment-methods/dto/create-payment-method.dto';
import { VerifyPaymentMethodDto } from '../payment-methods/dto/verify-payment-method.dto';
import { SetDefaultPaymentDto } from '../payment-methods/dto/set-default-payment.dto';

@Injectable()
export class MobilePaymentMethodsService {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) {}

  async getPaymentMethods(userId: string) {
    const methods = await this.paymentMethodsService.findByUserId(userId);
    
    // Filter out disabled (removed) payment methods
    const activeMethods = methods.filter(method => method.status !== 'disabled');
    
    // Transform for mobile app - mask card numbers and format response
    return activeMethods.map(method => ({
      id: method.id,
      type: method.type,
      provider: method.provider,
      status: method.status,
      isDefault: method.isDefault,
      createdAt: method.createdAt,
      cardDetails: method.cardDetails ? {
        cardNumber: this.maskCardNumber(method.cardDetails.cardNumber),
        cardholderName: method.cardDetails.cardholderName,
        expiryMonth: method.cardDetails.expiryMonth,
        expiryYear: method.cardDetails.expiryYear,
        cardType: method.cardDetails.cardType,
        cardCategory: method.cardDetails.cardCategory,
      } : null,
    }));
  }

  async createPaymentMethod(userId: string, dto: Omit<CreatePaymentMethodDto, 'userId'>) {
    const createDto: CreatePaymentMethodDto = {
      ...dto,
      userId,
    };
    
    const method = await this.paymentMethodsService.create(createDto);
    
    return {
      id: method.id,
      type: method.type,
      provider: method.provider,
      status: method.status,
      isDefault: method.isDefault,
      createdAt: method.createdAt,
      message: 'Payment method added successfully and ready to use.',
    };
  }

  async getPaymentMethod(userId: string, methodId: string) {
    const method = await this.paymentMethodsService.findOne(methodId);
    
    if (!method) {
      throw new NotFoundException('Payment method not found');
    }
    
    // Verify ownership
    if (method.userId !== userId) {
      throw new ForbiddenException('You do not have access to this payment method');
    }
    
    return {
      id: method.id,
      type: method.type,
      provider: method.provider,
      status: method.status,
      isDefault: method.isDefault,
      createdAt: method.createdAt,
      cardDetails: method.cardDetails ? {
        cardNumber: this.maskCardNumber(method.cardDetails.cardNumber),
        cardholderName: method.cardDetails.cardholderName,
        expiryMonth: method.cardDetails.expiryMonth,
        expiryYear: method.cardDetails.expiryYear,
        cardType: method.cardDetails.cardType,
        cardCategory: method.cardDetails.cardCategory,
      } : null,
    };
  }

  async verifyPaymentMethod(userId: string, methodId: string, dto: VerifyPaymentMethodDto) {
    const method = await this.paymentMethodsService.findOne(methodId);
    
    if (!method) {
      throw new NotFoundException('Payment method not found');
    }
    
    // Verify ownership
    if (method.userId !== userId) {
      throw new ForbiddenException('You do not have access to this payment method');
    }
    
    return this.paymentMethodsService.verify(methodId, dto);
  }

  async setDefaultPaymentMethod(userId: string, methodId: string, dto: SetDefaultPaymentDto) {
    const method = await this.paymentMethodsService.findOne(methodId);
    
    if (!method) {
      throw new NotFoundException('Payment method not found');
    }
    
    // Verify ownership
    if (method.userId !== userId) {
      throw new ForbiddenException('You do not have access to this payment method');
    }
    
    const updatedMethod = await this.paymentMethodsService.setDefault(methodId, dto);
    
    // Return transformed response for mobile app
    return {
      id: updatedMethod.id,
      type: updatedMethod.type,
      provider: updatedMethod.provider,
      status: updatedMethod.status,
      isDefault: updatedMethod.isDefault,
      createdAt: updatedMethod.createdAt,
      cardDetails: updatedMethod.cardDetails ? {
        cardNumber: this.maskCardNumber(updatedMethod.cardDetails.cardNumber),
        cardholderName: updatedMethod.cardDetails.cardholderName,
        expiryMonth: updatedMethod.cardDetails.expiryMonth,
        expiryYear: updatedMethod.cardDetails.expiryYear,
        cardType: updatedMethod.cardDetails.cardType,
        cardCategory: updatedMethod.cardDetails.cardCategory,
      } : null,
    };
  }

  async deletePaymentMethod(userId: string, methodId: string) {
    const method = await this.paymentMethodsService.findOne(methodId);
    
    if (!method) {
      throw new NotFoundException('Payment method not found');
    }
    
    // Verify ownership
    if (method.userId !== userId) {
      throw new ForbiddenException('You do not have access to this payment method');
    }
    
    return this.paymentMethodsService.remove(methodId);
  }

  private maskCardNumber(cardNumber: string): string {
    if (!cardNumber || cardNumber.length < 4) {
      return '****';
    }
    const last4 = cardNumber.slice(-4);
    return `****${last4}`;
  }
}

