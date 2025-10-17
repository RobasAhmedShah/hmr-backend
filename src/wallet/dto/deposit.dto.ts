import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class DepositDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsNumber()
  @Min(0.01)
  amountUSDT: number;
}

