import { IsString, IsEnum, IsOptional, IsUrl, IsObject } from 'class-validator';

export class CreateKycDto {
  @IsString()
  userId: string; // Can be UUID or displayCode

  @IsEnum(['cnic', 'passport', 'license', 'other'])
  type: 'cnic' | 'passport' | 'license' | 'other';

  @IsString()
  @IsUrl()
  documentFrontUrl: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  documentBackUrl?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  selfieUrl?: string;

  @IsOptional()
  @IsObject()
  metadata?: any;
}
