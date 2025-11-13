import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { MobilePropertiesService } from './mobile-properties.service';
import { PropertyFilterDto } from './dto/property-filter.dto';
import { JwtAuthGuard } from '../mobile-auth/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';

@Controller('api/mobile/properties')
export class MobilePropertiesController {
  constructor(private readonly mobilePropertiesService: MobilePropertiesService) {}

  @Get()
  @Public() // Properties listing can be public (or make it protected if needed)
  async findAll(@Query() query: PropertyFilterDto) {
    return this.mobilePropertiesService.findAllWithFilters(query);
  }

  @Get(':id')
  @Public() // Property details can be public (or make it protected if needed)
  async findOne(@Param('id') id: string) {
    return this.mobilePropertiesService.findOne(id);
  }
}

