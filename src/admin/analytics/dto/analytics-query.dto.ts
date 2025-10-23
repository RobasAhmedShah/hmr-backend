import { IsOptional, IsEnum, IsISO8601, IsString } from 'class-validator';

export class AnalyticsQueryDto {
  @IsOptional()
  @IsEnum(['7d', '30d', '90d', '1y'])
  period?: '7d' | '30d' | '90d' | '1y';

  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  organizationId?: string;

  @IsOptional()
  @IsString()
  propertyId?: string;
}
