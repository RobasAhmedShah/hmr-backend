import { IsOptional, IsInt, IsString, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum PropertyStatus {
  PLANNING = 'planning',
  CONSTRUCTION = 'construction',
  ACTIVE = 'active',
  ONHOLD = 'onhold',
  SOLDOUT = 'soldout',
  COMPLETED = 'completed',
}

export enum PropertyFilter {
  TRENDING = 'Trending',
  HIGH_YIELD = 'High Yield',
  NEW_LISTINGS = 'New Listings',
  COMPLETED = 'Completed',
}

export class PropertyFilterDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsEnum(PropertyStatus)
  status?: PropertyStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minROI?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPricePerToken?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(PropertyFilter)
  filter?: PropertyFilter;
}

