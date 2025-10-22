import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentMethodsController } from './payment-methods.controller';
import { PaymentMethodsService } from './payment-methods.service';
import { PaymentMethod } from './entities/payment-method.entity';
import { CardDetails } from './entities/card-details.entity';
import { User } from '../admin/entities/user.entity';
import { KycVerification } from '../kyc/entities/kyc-verification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentMethod, CardDetails, User, KycVerification]),
  ],
  controllers: [PaymentMethodsController],
  providers: [PaymentMethodsService],
  exports: [PaymentMethodsService],
})
export class PaymentMethodsModule {}
