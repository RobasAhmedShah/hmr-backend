import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from './entities/organization.entity';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { OrganizationAdminsModule } from '../organization-admins/organization-admins.module';
import { OrganizationAdmin } from '../organization-admins/entities/organization-admin.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Organization, OrganizationAdmin]), OrganizationAdminsModule],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}


