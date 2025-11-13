import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MobileProfileController } from './mobile-profile.controller';
import { MobileProfileService } from './mobile-profile.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [ConfigModule, UsersModule],
  controllers: [MobileProfileController],
  providers: [MobileProfileService],
  exports: [MobileProfileService],
})
export class MobileProfileModule {}

