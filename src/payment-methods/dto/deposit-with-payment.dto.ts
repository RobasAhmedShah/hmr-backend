import { IsString, IsNumber, IsUUID, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class DepositWithPaymentDto {
  @IsString()
  userId: string; // Can be UUID or displayCode

  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  amountUSDT: number;

  @IsOptional()
  @IsUUID()
  methodId?: string; // Payment method UUID - optional, will use default if not provided
}
