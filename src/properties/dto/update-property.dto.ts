import { IsOptional, IsString, IsNumber, IsEnum, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePropertyDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['residential', 'commercial', 'mixed'])
  type?: 'residential' | 'commercial' | 'mixed';

  @IsOptional()
  @IsString()
  status?: string; // Dynamic status - can be any string value

  @IsOptional()
  @IsNumber()
  totalValueUSDT?: number;

  @IsOptional()
  @IsNumber()
  totalTokens?: number;

  @IsOptional()
  @IsNumber()
  availableTokens?: number;

  @IsOptional()
  @IsNumber()
  pricePerTokenUSDT?: number;

  @IsOptional()
  @IsNumber()
  expectedROI?: number;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsObject()
  features?: any;

  @IsOptional()
  @IsObject()
  images?: any;

  @IsOptional()
  @IsObject()
  documents?: any;
}
