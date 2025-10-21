import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  // Get all transactions
  @Get()
  async getAllTransactions() {
    return this.transactionsService.findAllTransactions();
  }

  // Get transactions for a specific user
  @Get('user/:userId')
  async getUserTransactions(@Param('userId') userId: string) {
    const transactions = await this.transactionsService.findUserTransactions(userId);
    if (!transactions || transactions.length === 0) {
      throw new NotFoundException(`No transactions found for user ${userId}`);
    }
    return transactions;
  }
}


