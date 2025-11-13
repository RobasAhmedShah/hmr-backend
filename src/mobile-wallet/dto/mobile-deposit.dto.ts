import { IsNumber, IsUUID, IsOptional, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class MobileDepositDto {
  @IsNumber()
  @Min(0.01, { message: 'Amount must be at least 0.01' })
  @Transform(({ value }) => parseFloat(value))
  amountUSDT: number;

  @IsOptional()
  @IsUUID('4', { message: 'Payment method ID must be a valid UUID' })
  paymentMethodId?: string; // Optional - will use default payment method if not provided
}

