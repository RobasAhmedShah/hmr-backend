import { IsString, IsNotEmpty, IsOptional, IsBoolean, Length, Matches } from 'class-validator';

export class CardDetailsDto {
  @IsNotEmpty()
  @IsString()
  @Length(13, 19) // Card numbers can be 13-19 digits
  cardNumber: string;

  @IsNotEmpty()
  @IsString()
  @Length(2, 100)
  cardholderName: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^(0[1-9]|1[0-2])$/, { message: 'Expiry month must be MM format (01-12)' })
  expiryMonth: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^(20[2-9][0-9]|2[1-9][0-9][0-9])$/, { message: 'Expiry year must be YYYY format and future year' })
  expiryYear: string;

  @IsNotEmpty()
  @IsString()
  @Length(3, 4)
  cvv: string;

  @IsNotEmpty()
  @IsString()
  @Length(2, 20)
  cardType: string; // Visa, Mastercard, American Express, etc.

  @IsNotEmpty()
  @IsString()
  @Length(4, 20)
  cardCategory: string; // Credit, Debit, Prepaid

  @IsNotEmpty()
  @IsString()
  @Length(5, 255)
  billingAddress: string;

  @IsNotEmpty()
  @IsString()
  @Length(2, 100)
  billingCity: string;

  @IsNotEmpty()
  @IsString()
  @Length(2, 100)
  billingState: string;

  @IsNotEmpty()
  @IsString()
  @Length(3, 20)
  billingPostalCode: string;

  @IsNotEmpty()
  @IsString()
  @Length(2, 100)
  billingCountry: string;

  @IsOptional()
  @IsString()
  @Length(2, 100)
  issuingBank?: string;

  @IsOptional()
  @IsString()
  @Length(2, 20)
  bankCode?: string;

  @IsOptional()
  @IsString()
  @Length(10, 50)
  token?: string; // For tokenized cards

  @IsOptional()
  @IsBoolean()
  isTokenized?: boolean;
}
