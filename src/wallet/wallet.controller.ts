import { Body, Controller, Get, Param, Post, Patch } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { DepositDto } from './dto/deposit.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post('deposit')
  deposit(@Body() dto: DepositDto) {
    return this.walletService.deposit(dto);
  }

  @Get('user/:userId')
  findByUserId(@Param('userId') userId: string) {
    return this.walletService.findByUserId(userId);
  }

  @Get()
  findAll() {
    return this.walletService.findAll();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWalletDto: UpdateWalletDto) {
    return this.walletService.update(id, updateWalletDto);
  }
}
