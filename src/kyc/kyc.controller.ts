import { Controller, Get, Post, Patch, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { KycService } from './kyc.service';
import { CreateKycDto } from './dto/create-kyc.dto';
import { UpdateKycDto } from './dto/update-kyc.dto';

@Controller('kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createKycDto: CreateKycDto) {
    return this.kycService.create(createKycDto);
  }

  @Get()
  findAll() {
    return this.kycService.findAll();
  }

  @Get('user/:userId')
  findByUserId(@Param('userId') userId: string) {
    return this.kycService.findByUserId(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.kycService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateKycDto: UpdateKycDto) {
    return this.kycService.update(id, updateKycDto);
  }
}


