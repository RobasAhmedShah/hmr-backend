import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { OrganizationsService } from '../organizations/organizations.service';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly organizationsService: OrganizationsService,
  ) {}

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

  // Organizations management
  @Post('organizations')
  createOrganization(@Body() body: any) {
    return this.organizationsService.createWithAdmin(body);
  }

  @Get('organizations')
  listOrganizations() {
    return this.organizationsService.listWithAdmin();
  }

  @Patch('organizations/:id')
  updateOrganization(@Param('id') id: string, @Body() body: any) {
    return this.organizationsService.updateAdminManaged(id, body);
  }

  @Delete('organizations/:id')
  deleteOrganization(@Param('id') id: string) {
    return this.organizationsService.deleteAdminManaged(id);
  }

  @Post('organizations/:id/reset-password')
  resetOrgAdminPassword(@Param('id') id: string, @Body() body: { newPassword?: string }) {
    return this.organizationsService.resetOrgAdminPassword(id, body?.newPassword);
  }
}


