import { Controller, Get, UseGuards } from '@nestjs/common';
import { MobileWalletService } from './mobile-wallet.service';
import { JwtAuthGuard } from '../mobile-auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../admin/entities/user.entity';

@Controller('api/mobile/wallet')
@UseGuards(JwtAuthGuard)
export class MobileWalletController {
  constructor(private readonly mobileWalletService: MobileWalletService) {}

  @Get()
  async getWallet(@CurrentUser() user: User) {
    return this.mobileWalletService.getWallet(user.id);
  }
}

