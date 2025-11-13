import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MobilePropertiesController } from './mobile-properties.controller';
import { MobilePropertiesService } from './mobile-properties.service';
import { Property } from '../properties/entities/property.entity';
import { PropertiesModule } from '../properties/properties.module';

@Module({
  imports: [TypeOrmModule.forFeature([Property]), PropertiesModule],
  controllers: [MobilePropertiesController],
  providers: [MobilePropertiesService],
  exports: [MobilePropertiesService],
})
export class MobilePropertiesModule {}

