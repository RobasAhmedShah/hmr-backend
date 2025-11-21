import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { MobileCertificatesController } from './mobile-certificates.controller';
import { CertificatesModule } from '../certificates/certificates.module';
import { Transaction } from '../transactions/entities/transaction.entity';

@Module({
  imports: [
    ConfigModule,
    CertificatesModule,
    TypeOrmModule.forFeature([Transaction]),
  ],
  controllers: [MobileCertificatesController],
})
export class MobileCertificatesModule {}

