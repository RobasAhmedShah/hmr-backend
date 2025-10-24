import { IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateWalletDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  balanceUSDT?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  lockedUSDT?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  totalDepositedUSDT?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  totalWithdrawnUSDT?: number;
}
