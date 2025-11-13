import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MobileWalletController } from './mobile-wallet.controller';
import { MobileWalletService } from './mobile-wallet.service';
import { WalletModule } from '../wallet/wallet.module';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { InvestmentsModule } from '../investments/investments.module';
import { PaymentMethodsModule } from '../payment-methods/payment-methods.module';

@Module({
  imports: [
    ConfigModule,
    WalletModule,
    PortfolioModule,
    TransactionsModule,
    InvestmentsModule,
    PaymentMethodsModule,
  ],
  controllers: [MobileWalletController],
  providers: [MobileWalletService],
  exports: [MobileWalletService],
})
export class MobileWalletModule {}

