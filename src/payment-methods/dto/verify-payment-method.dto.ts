import { IsEnum } from 'class-validator';

export class VerifyPaymentMethodDto {
  @IsEnum(['verified', 'disabled'])
  status: 'verified' | 'disabled';
}
