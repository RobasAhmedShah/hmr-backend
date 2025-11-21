import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Property } from '../properties/entities/property.entity';
import { PropertyFilterDto, PropertyFilter } from './dto/property-filter.dto';
import Decimal from 'decimal.js';

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class MobilePropertiesService {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepo: Repository<Property>,
  ) {}

  async findAllWithFilters(query: PropertyFilterDto): Promise<PaginatedResponse<any>> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    // Build query
    let qb = this.propertyRepo
      .createQueryBuilder('property')
      .leftJoinAndSelect('property.organization', 'organization');

    // Apply filters
    if (query.city) {
      qb = qb.andWhere('property.city = :city', { city: query.city });
    }

    if (query.status) {
      qb = qb.andWhere('property.status = :status', { status: query.status });
    }

    if (query.minROI !== undefined) {
      qb = qb.andWhere('property.expectedROI >= :minROI', { minROI: query.minROI });
    }

    if (query.maxPricePerToken !== undefined) {
      qb = qb.andWhere('property.pricePerTokenUSDT <= :maxPricePerToken', {
        maxPricePerToken: query.maxPricePerToken,
      });
    }

    // Search filter (searches in title, description, city)
    if (query.search) {
      qb = qb.andWhere(
        '(property.title ILIKE :search OR property.description ILIKE :search OR property.city ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    // Apply predefined filters
    if (query.filter) {
      qb = this.applyPredefinedFilter(qb, query.filter);
    }

    // Get total count before pagination
    const total = await qb.getCount();

    // Apply pagination
    const properties = await qb
      .orderBy('property.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    // Transform properties with error handling
    const transformedProperties = properties
      .map((p) => {
        try {
          return this.transformProperty(p);
        } catch (error) {
          console.error(`[MobilePropertiesService] Error transforming property ${p.id}:`, error);
          return null;
        }
      })
      .filter((p) => p !== null); // Remove failed transformations

    return {
      data: transformedProperties,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<any> {
    // Check if it's a UUID format (contains hyphens and is 36 chars)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    let property: Property | null;

    if (isUuid) {
      property = await this.propertyRepo.findOne({
        where: { id },
        relations: ['organization'],
      });
    } else {
      property = await this.propertyRepo.findOne({
        where: { displayCode: id },
        relations: ['organization'],
      });
    }

    if (!property) {
      throw new NotFoundException(`Property with id or displayCode '${id}' not found`);
    }

    return this.transformProperty(property);
  }

  private applyPredefinedFilter(
    qb: SelectQueryBuilder<Property>,
    filter: PropertyFilter,
  ): SelectQueryBuilder<Property> {
    switch (filter) {
      case PropertyFilter.TRENDING:
        // High funding progress - properties with more than 30% tokens sold
        // TODO: Implement actual trending logic based on recent investments (last 7 days)
        // For now, using sold percentage as a proxy
        qb = qb.andWhere(
          '(CAST(property.totalTokens AS DECIMAL) - CAST(property.availableTokens AS DECIMAL)) / NULLIF(CAST(property.totalTokens AS DECIMAL), 0) > 0.3',
        );
        break;

      case PropertyFilter.HIGH_YIELD:
        // ROI >= 10%
        qb = qb.andWhere('property.expectedROI >= :highYield', { highYield: 10 });
        break;

      case PropertyFilter.NEW_LISTINGS:
        // Created in last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        qb = qb.andWhere('property.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo });
        break;

      case PropertyFilter.COMPLETED:
        // Status is completed
        qb = qb.andWhere('property.status = :completed', { completed: 'completed' });
        break;
    }

    return qb;
  }

  private transformProperty(property: Property): any {
    // ✅ Safe Decimal conversion with null checks
    const totalTokens = property.totalTokens ? new Decimal(property.totalTokens) : new Decimal(0);
    const availableTokens = property.availableTokens ? new Decimal(property.availableTokens) : new Decimal(0);
    const soldTokens = totalTokens.minus(availableTokens);
    
    const totalValueUSDT = property.totalValueUSDT ? new Decimal(property.totalValueUSDT) : new Decimal(0);
    const pricePerTokenUSDT = property.pricePerTokenUSDT ? new Decimal(property.pricePerTokenUSDT) : new Decimal(0);
    const expectedROI = property.expectedROI ? new Decimal(property.expectedROI) : new Decimal(0);

    return {
      id: property.id,
      displayCode: property.displayCode,
      title: property.title || '',
      location: property.city ? `${property.city}, ${property.country || ''}`.trim() : null,
      city: property.city || null,
      country: property.country || null,
      valuation: totalValueUSDT.toNumber(),
      tokenPrice: pricePerTokenUSDT.toNumber(),
      minInvestment: pricePerTokenUSDT.toNumber(), // Minimum is one token
      totalTokens: totalTokens.toNumber(),
      soldTokens: soldTokens.toNumber(),
      availableTokens: availableTokens.toNumber(),
      estimatedROI: expectedROI.toNumber(),
      estimatedYield: expectedROI.toNumber(), // Same as ROI for now
      completionDate: null, // TODO: Add completionDate field to Property entity
      status: property.status || 'active',
      images: this.extractImages(property.images),
      description: property.description || '',
      amenities: this.extractAmenities(property.features),
      builder: {
        id: property.organization?.id || null,
        name: property.organization?.name || null,
        logo: property.organization?.logoUrl || null,
        rating: 0, // TODO: Implement rating system
        projectsCompleted: 0, // TODO: Count completed properties for this organization
      },
      features: this.extractFeatures(property.features),
      type: property.type || 'residential',
      slug: property.slug || '',
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
    };
  }

  private extractImages(images: any): string[] {
    if (!images) return [];
    if (Array.isArray(images)) {
      return images.map((img) => (typeof img === 'string' ? img : img.url || '')).filter(Boolean);
    }
    return [];
  }

  private extractAmenities(features: any): string[] {
    if (!features) return [];
    if (typeof features === 'object') {
      // Extract amenities from features object
      const amenities: string[] = [];
      if (features.amenities && Array.isArray(features.amenities)) {
        return features.amenities;
      }
      // Try to extract common amenities
      if (features.pool) amenities.push('pool');
      if (features.gym) amenities.push('gym');
      if (features.parking) amenities.push('parking');
      if (features.security) amenities.push('security');
      return amenities;
    }
    return [];
  }

  private extractFeatures(features: any): any {
    if (!features) return {};
    if (typeof features === 'object') {
      return {
        bedrooms: features.bedrooms || null,
        bathrooms: features.bathrooms || null,
        area: features.area || null,
        floors: features.floors || null,
        units: features.units || null,
      };
    }
    return {};
  }
}

