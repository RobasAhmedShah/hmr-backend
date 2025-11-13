import { IsString, IsNotEmpty, IsNumber, Min, IsOptional } from 'class-validator';

export class CreateInvestmentDto {
  @IsString()
  @IsNotEmpty()
  propertyId: string;

  @IsNumber()
  @Min(0.000001, { message: 'Token count must be greater than 0' })
  tokenCount: number;

  @IsOptional()
  @IsNumber()
  transactionFee?: number;
}

