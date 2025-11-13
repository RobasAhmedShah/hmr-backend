import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MobilePaymentMethodsController } from './mobile-payment-methods.controller';
import { MobilePaymentMethodsService } from './mobile-payment-methods.service';
import { PaymentMethodsModule } from '../payment-methods/payment-methods.module';

@Module({
  imports: [ConfigModule, PaymentMethodsModule],
  controllers: [MobilePaymentMethodsController],
  providers: [MobilePaymentMethodsService],
  exports: [MobilePaymentMethodsService],
})
export class MobilePaymentMethodsModule {}

