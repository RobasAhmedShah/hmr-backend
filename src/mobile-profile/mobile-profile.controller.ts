import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { MobileProfileService } from './mobile-profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../mobile-auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../admin/entities/user.entity';

@Controller('api/mobile/profile')
@UseGuards(JwtAuthGuard)
export class MobileProfileController {
  constructor(private readonly mobileProfileService: MobileProfileService) {}

  @Get()
  async getProfile(@CurrentUser() user: User) {
    return this.mobileProfileService.getProfile(user.id);
  }

  @Patch()
  async updateProfile(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    return this.mobileProfileService.updateProfile(user.id, dto);
  }
}

