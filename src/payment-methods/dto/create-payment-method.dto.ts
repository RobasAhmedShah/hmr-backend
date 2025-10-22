import { IsString, IsEnum, IsOptional, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CardDetailsDto } from './card-details.dto';

export class CreatePaymentMethodDto {
  @IsString()
  userId: string; // Can be UUID or displayCode

  @IsEnum(['card', 'bank', 'crypto'])
  type: 'card' | 'bank' | 'crypto';

  @IsString()
  provider: string; // e.g., "Visa", "Binance Pay", "USDC Wallet"

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean; // Mark as default payment method

  @IsOptional()
  @ValidateNested()
  @Type(() => CardDetailsDto)
  cardDetails?: CardDetailsDto; // Required for card type payment methods
}
