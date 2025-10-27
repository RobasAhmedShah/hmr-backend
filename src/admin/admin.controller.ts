import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  findAll(@Query('org') org?: string) {
    if (org) {
      return this.adminService.findInvestorsByOrganization(org);
    }
    return this.adminService.findAll();
  }

  @Post('users')
  create(@Body() data: any) {
    return this.adminService.create(data);
  }
}


