import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { PaymentMethod } from './payment-method.entity';

@Entity('card_details')
export class CardDetails {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PaymentMethod, (paymentMethod) => paymentMethod.cardDetails, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'paymentMethodId' })
  paymentMethod: PaymentMethod;

  @Column({ type: 'uuid' })
  paymentMethodId: string;

  // Card Information
  @Column({ type: 'varchar', length: 19 }) // Up to 19 digits for card number
  cardNumber: string;

  @Column({ type: 'varchar', length: 100 })
  cardholderName: string;

  @Column({ type: 'varchar', length: 2 }) // MM format
  expiryMonth: string;

  @Column({ type: 'varchar', length: 4 }) // YYYY format
  expiryYear: string;

  @Column({ type: 'varchar', length: 4 }) // CVV/CVC
  cvv: string;

  // Card Type and Brand
  @Column({ type: 'varchar', length: 20 }) // Visa, Mastercard, American Express, etc.
  cardType: string;

  @Column({ type: 'varchar', length: 20 }) // Credit, Debit, Prepaid
  cardCategory: string;

  // Billing Address
  @Column({ type: 'varchar', length: 255 })
  billingAddress: string;

  @Column({ type: 'varchar', length: 100 })
  billingCity: string;

  @Column({ type: 'varchar', length: 100 })
  billingState: string;

  @Column({ type: 'varchar', length: 20 })
  billingPostalCode: string;

  @Column({ type: 'varchar', length: 100 })
  billingCountry: string;

  // Bank Information
  @Column({ type: 'varchar', length: 100, nullable: true })
  issuingBank?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  bankCode?: string;

  // Additional Security
  @Column({ type: 'varchar', length: 50, nullable: true })
  token?: string; // For tokenized cards

  @Column({ type: 'boolean', default: false })
  isTokenized: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
