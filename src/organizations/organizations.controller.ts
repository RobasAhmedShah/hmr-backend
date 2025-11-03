import { Body, Controller, Get, Param, Post, NotFoundException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  create(@Body() dto: CreateOrganizationDto) {
    return this.organizationsService.create(dto);
  }

  @Get()
  findAll() {
    return this.organizationsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const org = await this.organizationsService.findByIdOrDisplayCode(id);
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  @Get(':id/liquidity')
  async getLiquidity(@Param('id') id: string) {
    const org = await this.organizationsService.findByIdOrDisplayCode(id);
    if (!org) throw new NotFoundException('Organization not found');
    
    return {
      organizationId: org.displayCode,
      organizationName: org.name,
      liquidityUSDT: org.liquidityUSDT.toString(),
      lastUpdated: org.updatedAt,
    };
  }

  @Get(':id/transactions')
  async getTransactions(@Param('id') id: string) {
    const transactions = await this.organizationsService.findTransactions(id);
    return { success: true, transactions };
  }

  /**
   * Upload logo for an organization
   * Use this endpoint after creating an organization to add a logo
   */
  @Post(':id/upload-logo')
  @UseInterceptors(FileInterceptor('logo'))
  async uploadLogo(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    return this.organizationsService.uploadLogo(id, file);
  }

}

