import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';
import { KycVerification } from './entities/kyc-verification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([KycVerification])],
  controllers: [KycController],
  providers: [KycService],
})
export class KycModule {}


