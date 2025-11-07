import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property } from '../properties/entities/property.entity';

@Injectable()
export class ChatbotDatabaseService {
  constructor(
    @InjectRepository(Property)
    private propertyRepository: Repository<Property>,
  ) {}

  async getPropertyDetails(args: {
    propertyId?: string;
    propertyTitle?: string;
    displayCode?: string;
  }) {
    const { propertyId, propertyTitle, displayCode } = args;
    const queryBuilder = this.propertyRepository.createQueryBuilder('property');

    if (propertyId) {
      queryBuilder.where('property.id = :id', { id: propertyId });
    } else if (displayCode) {
      queryBuilder.where('property.displayCode = :code', { code: displayCode });
    } else if (propertyTitle) {
      queryBuilder.where('property.title ILIKE :title', { title: `%${propertyTitle}%` });
    } else {
      throw new Error('Please provide propertyId, propertyTitle, or displayCode');
    }

    return await queryBuilder.getOne();
  }

  async searchProperties(args: {
    city?: string;
    country?: string;
    status?: string;
    type?: string;
    minROI?: number;
    maxPricePerToken?: number;
  }) {
    const { city, country, status, type, minROI, maxPricePerToken } = args;
    const queryBuilder = this.propertyRepository.createQueryBuilder('property');

    if (city) {
      queryBuilder.andWhere('property.city ILIKE :city', { city: `%${city}%` });
    }

    if (country) {
      queryBuilder.andWhere('property.country ILIKE :country', { country: `%${country}%` });
    }

    if (status) {
      queryBuilder.andWhere('property.status = :status', { status });
    }

    if (type) {
      queryBuilder.andWhere('property.type = :type', { type });
    }

    if (minROI !== undefined) {
      queryBuilder.andWhere('property.expectedROI >= :minROI', { minROI });
    }

    if (maxPricePerToken !== undefined) {
      queryBuilder.andWhere('property.pricePerTokenUSDT <= :maxPrice', { maxPrice: maxPricePerToken });
    }

    queryBuilder.orderBy('property.createdAt', 'DESC').limit(20);

    return await queryBuilder.getMany();
  }

  async getPropertyFinancials(args: {
    propertyId?: string;
    propertyTitle?: string;
  }) {
    const { propertyId, propertyTitle } = args;
    const queryBuilder = this.propertyRepository
      .createQueryBuilder('property')
      .select([
        'property.id',
        'property.title',
        'property.pricePerTokenUSDT',
        'property.expectedROI',
        'property.totalValueUSDT',
        'property.totalTokens',
        'property.availableTokens',
      ])
      .addSelect('(property.totalTokens - property.availableTokens)', 'soldTokens');

    if (propertyId) {
      queryBuilder.where('property.id = :id', { id: propertyId });
    } else if (propertyTitle) {
      queryBuilder.where('property.title ILIKE :title', { title: `%${propertyTitle}%` });
    } else {
      throw new Error('Please provide propertyId or propertyTitle');
    }

    return await queryBuilder.getRawOne();
  }
}

