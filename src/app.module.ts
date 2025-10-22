import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AdminModule } from './admin/admin.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { UsersModule } from './users';
import { KycModule } from './kyc';
import { PropertiesModule } from './properties';
import { WalletModule } from './wallet';
import { TransactionsModule } from './transactions';
import { InvestmentsModule } from './investments';
import { RewardsModule } from './rewards';
import { PortfolioModule } from './portfolio';
import { ListenersModule } from './listeners/listeners.module';

@Module({
  imports: [
    DatabaseModule,
    EventEmitterModule.forRoot(), // Event-driven architecture
    AdminModule,
    OrganizationsModule,
    UsersModule,
    KycModule,
    PropertiesModule,
    WalletModule,
    TransactionsModule,
    InvestmentsModule,
    RewardsModule,
    PortfolioModule,
    ListenersModule, // Event listeners for cross-service updates
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
