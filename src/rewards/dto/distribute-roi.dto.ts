import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class DistributeRoiDto {
  @IsString()
  @IsNotEmpty()
  propertyId: string;

  @IsNumber()
  @Min(0.01)
  totalRoiUSDT: number;
}

