import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';

export class UpdateKycDto {
  @IsOptional()
  @IsEnum(['pending', 'verified', 'rejected'])
  status?: 'pending' | 'verified' | 'rejected';

  @IsOptional()
  @IsString()
  reviewer?: string;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
