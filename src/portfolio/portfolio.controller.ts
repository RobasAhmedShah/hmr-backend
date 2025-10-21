import { Controller, Get, Param } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';

@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get('user/:userId/detailed')
  async getDetailedPortfolio(@Param('userId') userId: string) {
    return this.portfolioService.getDetailedPortfolio(userId);
  }
}


