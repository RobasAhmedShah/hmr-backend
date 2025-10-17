import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Decimal from 'decimal.js';
import { Property } from './entities/property.entity';
import { CreatePropertyDto } from './dto/create-property.dto';

@Injectable()
export class PropertiesService {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepo: Repository<Property>,
  ) {}

  async create(dto: CreatePropertyDto) {
    const totalValue = new Decimal(dto.totalValueUSDT);
    const totalTokens = new Decimal(dto.totalTokens);
    const price = totalValue.div(totalTokens);
    
    // Generate displayCode using sequence
    const result = await this.propertyRepo.query('SELECT nextval(\'property_display_seq\') as nextval');
    const displayCode = `PROP-${result[0].nextval.toString().padStart(6, '0')}`;
    
    const property = this.propertyRepo.create({
      ...dto,
      status: dto.status ?? 'planning',
      totalValueUSDT: totalValue,
      totalTokens: totalTokens,
      pricePerTokenUSDT: price,
      availableTokens: totalTokens,
      expectedROI: new Decimal(dto.expectedROI),
      displayCode,
    });
    return this.propertyRepo.save(property);
  }

  async findAll() {
    return this.propertyRepo.find({ relations: ['organization'] });
  }

  async findOne(id: string) {
    return this.propertyRepo.findOne({ where: { id }, relations: ['organization'] });
  }

  async findBySlug(slug: string) {
    return this.propertyRepo.findOne({ where: { slug }, relations: ['organization'] });
  }

  async findByDisplayCode(displayCode: string) {
    return this.propertyRepo.findOne({ where: { displayCode }, relations: ['organization'] });
  }

  async findByIdOrDisplayCode(idOrCode: string) {
    // Check if it's a UUID format (contains hyphens and is 36 chars)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrCode);
    
    if (isUuid) {
      return this.propertyRepo.findOne({ where: { id: idOrCode }, relations: ['organization'] });
    } else {
      return this.propertyRepo.findOne({ where: { displayCode: idOrCode }, relations: ['organization'] });
    }
  }

  async findBySlugOrDisplayCode(slugOrCode: string) {
    return this.propertyRepo.findOne({
      where: [
        { slug: slugOrCode },
        { displayCode: slugOrCode }
      ],
      relations: ['organization']
    });
  }
}


