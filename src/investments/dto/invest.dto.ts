import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class InvestDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  propertyId: string;

  @IsNumber()
  @Min(0.000001)
  tokensToBuy: number;
}
