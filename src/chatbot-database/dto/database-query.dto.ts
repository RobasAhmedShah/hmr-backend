import { IsString, IsNumber, IsOptional } from 'class-validator';

export class GetPropertyDetailsDto {
  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsOptional()
  @IsString()
  propertyTitle?: string;

  @IsOptional()
  @IsString()
  displayCode?: string;
}

export class SearchPropertiesDto {
  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsNumber()
  minROI?: number;

  @IsOptional()
  @IsNumber()
  maxPricePerToken?: number;
}

export class GetPropertyFinancialsDto {
  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsOptional()
  @IsString()
  propertyTitle?: string;
}

