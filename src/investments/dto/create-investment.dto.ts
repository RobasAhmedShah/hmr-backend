import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateInvestmentDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  propertyId: string;

  @IsNumber()
  @Min(0.01)
  amountUSDT: number;
}

