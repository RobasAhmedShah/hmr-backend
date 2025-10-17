import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { User } from './entities/user.entity';
import { Wallet } from '../wallet/entities/wallet.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Wallet])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}


