import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { MobileTransactionsService } from './mobile-transactions.service';
import { TransactionFilterDto } from './dto/transaction-filter.dto';
import { JwtAuthGuard } from '../mobile-auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../admin/entities/user.entity';

@Controller('api/mobile/transactions')
@UseGuards(JwtAuthGuard)
export class MobileTransactionsController {
  constructor(private readonly mobileTransactionsService: MobileTransactionsService) {}

  @Get()
  async getTransactions(@CurrentUser() user: User, @Query() query: TransactionFilterDto) {
    return this.mobileTransactionsService.findByUserWithFilters(user.id, query);
  }
}

