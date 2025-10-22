import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { User } from '../../admin/entities/user.entity';
import { CardDetails } from './card-details.entity';

export type PaymentMethodType = 'card' | 'bank' | 'crypto';
export type PaymentMethodStatus = 'pending' | 'verified' | 'disabled';

@Entity('payment_methods')
export class PaymentMethod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 32 })
  type: PaymentMethodType;

  @Column({ type: 'varchar', length: 64 })
  provider: string; // e.g., "Visa", "Binance Pay", "USDC Wallet"

  @Column({ type: 'varchar', length: 32, default: 'pending' })
  status: PaymentMethodStatus;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean; // Mark as default payment method for user

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (user) => user.paymentMethods, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToOne(() => CardDetails, (cardDetails) => cardDetails.paymentMethod, { nullable: true })
  cardDetails?: CardDetails;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
