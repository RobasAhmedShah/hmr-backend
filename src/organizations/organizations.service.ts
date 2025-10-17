import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './entities/organization.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
  ) {}

  async create(dto: CreateOrganizationDto) {
    // Generate displayCode using sequence
    const result = await this.orgRepo.query('SELECT nextval(\'organization_display_seq\') as nextval');
    const displayCode = `ORG-${result[0].nextval.toString().padStart(6, '0')}`;
    
    const org = this.orgRepo.create({
      ...dto,
      displayCode,
    });
    return this.orgRepo.save(org);
  }

  async findAll() {
    return this.orgRepo.find();
  }

  async findOne(id: string) {
    return this.orgRepo.findOne({ where: { id } });
  }

  async findByDisplayCode(displayCode: string) {
    return this.orgRepo.findOne({ where: { displayCode } });
  }

  async findByIdOrDisplayCode(idOrCode: string) {
    // Check if it's a UUID format (contains hyphens and is 36 chars)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrCode);
    
    if (isUuid) {
      return this.orgRepo.findOne({ where: { id: idOrCode } });
    } else {
      return this.orgRepo.findOne({ where: { displayCode: idOrCode } });
    }
  }

  async findTransactions(idOrCode: string) {
    // Check if it's a UUID format
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrCode);
    
    const org = await this.orgRepo.findOne({
      where: isUuid ? { id: idOrCode } : { displayCode: idOrCode },
      relations: ['transactions'],
    });
    
    return org?.transactions || [];
  }
}

