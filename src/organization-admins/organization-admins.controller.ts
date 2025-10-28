import { Body, Controller, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { OrganizationAdminsService } from './organization-admins.service';

@Controller('org/auth')
export class OrganizationAdminsController {
  constructor(private readonly orgAdminsService: OrganizationAdminsService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() body: { email: string; password: string }) {
    return this.orgAdminsService.login(body.email, body.password);
  }

  @Patch('change-password/:adminId')
  changePassword(
    @Param('adminId') adminId: string,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.orgAdminsService.changePassword(adminId, body.currentPassword, body.newPassword);
  }
}


