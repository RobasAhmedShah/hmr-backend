import { IsBoolean, IsNotEmpty } from 'class-validator';

export class SetDefaultPaymentDto {
  @IsNotEmpty()
  @IsBoolean()
  isDefault: boolean;
}
