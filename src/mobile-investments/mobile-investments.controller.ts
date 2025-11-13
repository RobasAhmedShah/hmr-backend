import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MobileInvestmentsService } from './mobile-investments.service';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { JwtAuthGuard } from '../mobile-auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../admin/entities/user.entity';

@Controller('api/mobile/investments')
@UseGuards(JwtAuthGuard)
export class MobileInvestmentsController {
  constructor(private readonly mobileInvestmentsService: MobileInvestmentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@CurrentUser() user: User, @Body() dto: CreateInvestmentDto) {
    return this.mobileInvestmentsService.create(user.id, dto.propertyId, dto.tokenCount);
  }

  @Get()
  async getMyInvestments(@CurrentUser() user: User) {
    const investments = await this.mobileInvestmentsService.findByUserId(user.id);
    return { investments };
  }

  @Get(':id')
  async findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.mobileInvestmentsService.findOne(id, user.id);
  }
}

