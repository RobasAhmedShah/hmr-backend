import { IsOptional, IsString, IsEnum, IsUrl, IsObject } from 'class-validator';

export class UpdateKycDto {
  @IsOptional()
  @IsEnum(['cnic', 'passport', 'license', 'other'])
  type?: 'cnic' | 'passport' | 'license' | 'other';

  @IsOptional()
  @IsEnum(['pending', 'verified', 'rejected'])
  status?: 'pending' | 'verified' | 'rejected';

  @IsOptional()
  @IsUrl()
  documentFrontUrl?: string;

  @IsOptional()
  @IsUrl()
  documentBackUrl?: string;

  @IsOptional()
  @IsUrl()
  selfieUrl?: string;

  @IsOptional()
  @IsString()
  reviewer?: string;

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @IsOptional()
  @IsObject()
  metadata?: any;
}