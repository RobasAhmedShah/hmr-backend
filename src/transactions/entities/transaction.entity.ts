import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { DecimalTransformer } from '../../common/decimal.transformer';
import Decimal from 'decimal.js';
import { User } from '../../admin/entities/user.entity';
import { Wallet } from '../../wallet/entities/wallet.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { Property } from '../../properties/entities/property.entity';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 32, unique: true })
  displayCode: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  userId?: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  walletId?: string | null;

  @ManyToOne(() => Wallet, { nullable: true })
  @JoinColumn({ name: 'walletId' })
  wallet?: Wallet;

  @Index('IDX_transactions_organization')
  @Column({ type: 'uuid', nullable: true })
  organizationId?: string | null;

  @ManyToOne(() => Organization, org => org.transactions, { nullable: true })
  @JoinColumn({ name: 'organizationId' })
  organization?: Organization;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  propertyId?: string | null;

  @ManyToOne(() => Property, { nullable: true })
  @JoinColumn({ name: 'propertyId' })
  property?: Property;

  @Column({ type: 'varchar', length: 32 })
  type: 'deposit' | 'withdrawal' | 'investment' | 'return' | 'fee' | 'reward' | 'inflow';

  @Column('numeric', { precision: 18, scale: 6, transformer: DecimalTransformer })
  amountUSDT: Decimal;

  @Column({ type: 'varchar', length: 32 })
  status: 'pending' | 'completed' | 'failed';

  @Column({ type: 'varchar', length: 128, nullable: true })
  fromEntity?: string | null;  // human-readable sender name

  @Column({ type: 'varchar', length: 128, nullable: true })
  toEntity?: string | null;    // human-readable receiver name

  @Column({ type: 'varchar', length: 64, nullable: true })
  referenceId?: string | null;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: any | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}


