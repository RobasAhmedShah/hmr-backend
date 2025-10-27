import { Body, Controller, Get, Param, Post, Patch, Delete, Query, NotFoundException, HttpCode, HttpStatus } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { UpdatePropertyStatusDto } from './dto/update-property-status.dto';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  create(@Body() dto: CreatePropertyDto) {
    return this.propertiesService.create(dto);
  }

  @Get()
  async findAll(@Query('slug') slug?: string, @Query('displayCode') displayCode?: string, @Query('org') org?: string) {
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
    if (org) {
      return this.propertiesService.findByOrganization(org);
    }
    return this.propertiesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const property = await this.propertiesService.findByIdOrDisplayCode(id);
    if (!property) throw new NotFoundException('Property not found');
    return property;
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePropertyDto: UpdatePropertyDto) {
    return this.propertiesService.update(id, updatePropertyDto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() updatePropertyStatusDto: UpdatePropertyStatusDto) {
    return this.propertiesService.updateStatus(id, updatePropertyStatusDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.propertiesService.remove(id);
  }
}
