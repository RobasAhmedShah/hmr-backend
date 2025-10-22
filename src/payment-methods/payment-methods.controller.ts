import { Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { PaymentMethodsService } from './payment-methods.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { VerifyPaymentMethodDto } from './dto/verify-payment-method.dto';
import { DepositWithPaymentDto } from './dto/deposit-with-payment.dto';
import { SetDefaultPaymentDto } from './dto/set-default-payment.dto';

@Controller('payment-methods')
export class PaymentMethodsController {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createPaymentMethodDto: CreatePaymentMethodDto) {
    return this.paymentMethodsService.create(createPaymentMethodDto);
  }

  @Get()
  findAll(@Query('userId') userId: string) {
    if (!userId) {
      throw new Error('userId query parameter is required');
    }
    return this.paymentMethodsService.findByUserId(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentMethodsService.findOne(id);
  }

  @Patch(':id/verify')
  verify(@Param('id') id: string, @Body() verifyPaymentMethodDto: VerifyPaymentMethodDto) {
    return this.paymentMethodsService.verify(id, verifyPaymentMethodDto);
  }

  @Patch(':id/default')
  setDefault(@Param('id') id: string, @Body() setDefaultPaymentDto: SetDefaultPaymentDto) {
    return this.paymentMethodsService.setDefault(id, setDefaultPaymentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.paymentMethodsService.remove(id);
  }

  @Post('deposit')
  @HttpCode(HttpStatus.OK)
  initiateDeposit(@Body() depositWithPaymentDto: DepositWithPaymentDto) {
    return this.paymentMethodsService.initiateDeposit(depositWithPaymentDto);
  }
}
