import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';
import { KycVerification } from './entities/kyc-verification.entity';
import { User } from '../admin/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([KycVerification, User])],
  controllers: [KycController],
  providers: [KycService],
  exports: [KycService],
})
export class KycModule {}


