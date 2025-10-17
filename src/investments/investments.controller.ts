import { Body, Controller, Get, Param, Post, Query, NotFoundException } from '@nestjs/common';
import { InvestmentsService } from './investments.service';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { InvestDto } from './dto/invest.dto';
import Decimal from 'decimal.js';

@Controller('investments')
export class InvestmentsController {
  constructor(private readonly investmentsService: InvestmentsService) {}

  @Post()
  async create(@Body() dto: CreateInvestmentDto) {
    const investment = await this.investmentsService.create(dto);
    return { success: true, data: investment };
  }

  @Post('invest')
  async invest(@Body() dto: InvestDto) {
    const investment = await this.investmentsService.invest(dto.userId, dto.propertyId, new Decimal(dto.tokensToBuy));
    return { success: true, data: investment };
  }

  @Get()
  findAll(@Query('userId') userId?: string) {
    if (userId) {
      return this.investmentsService.findByUserId(userId);
    }
    return this.investmentsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const investment = await this.investmentsService.findByIdOrDisplayCode(id);
    if (!investment) throw new NotFoundException('Investment not found');
    return investment;
  }
}
