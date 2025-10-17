import { Body, Controller, Get, Param, Post, Query, NotFoundException } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  create(@Body() dto: CreatePropertyDto) {
    return this.propertiesService.create(dto);
  }

  @Get()
  async findAll(@Query('slug') slug?: string, @Query('displayCode') displayCode?: string) {
    if (slug) {
      const property = await this.propertiesService.findBySlugOrDisplayCode(slug);
      if (!property) throw new NotFoundException('Property not found');
      return property;
    }
    if (displayCode) {
      const property = await this.propertiesService.findByDisplayCode(displayCode);
      if (!property) throw new NotFoundException('Property not found');
      return property;
    }
    return this.propertiesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const property = await this.propertiesService.findByIdOrDisplayCode(id);
    if (!property) throw new NotFoundException('Property not found');
    return property;
  }
}
