import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { MobilePaymentMethodsService } from './mobile-payment-methods.service';
import { JwtAuthGuard } from '../mobile-auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../admin/entities/user.entity';
import { CreatePaymentMethodDto } from '../payment-methods/dto/create-payment-method.dto';
import { VerifyPaymentMethodDto } from '../payment-methods/dto/verify-payment-method.dto';
import { SetDefaultPaymentDto } from '../payment-methods/dto/set-default-payment.dto';

@Controller('api/mobile/payment-methods')
@UseGuards(JwtAuthGuard)
export class MobilePaymentMethodsController {
  constructor(private readonly mobilePaymentMethodsService: MobilePaymentMethodsService) {}

  @Get()
  async getPaymentMethods(@CurrentUser() user: User) {
    return this.mobilePaymentMethodsService.getPaymentMethods(user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPaymentMethod(@CurrentUser() user: User, @Body() dto: Omit<CreatePaymentMethodDto, 'userId'>) {
    return this.mobilePaymentMethodsService.createPaymentMethod(user.id, dto);
  }

  @Get(':id')
  async getPaymentMethod(@CurrentUser() user: User, @Param('id') id: string) {
    return this.mobilePaymentMethodsService.getPaymentMethod(user.id, id);
  }

  @Patch(':id/verify')
  async verifyPaymentMethod(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: VerifyPaymentMethodDto
  ) {
    return this.mobilePaymentMethodsService.verifyPaymentMethod(user.id, id, dto);
  }

  @Patch(':id/default')
  async setDefaultPaymentMethod(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: SetDefaultPaymentDto
  ) {
    return this.mobilePaymentMethodsService.setDefaultPaymentMethod(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePaymentMethod(@CurrentUser() user: User, @Param('id') id: string) {
    return this.mobilePaymentMethodsService.deletePaymentMethod(user.id, id);
  }
}

