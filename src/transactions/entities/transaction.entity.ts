import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { DecimalTransformer } from '../../common/decimal.transformer';
import Decimal from 'decimal.js';
import { User } from '../../admin/entities/user.entity';
import { Wallet } from '../../wallet/entities/wallet.entity';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 32, unique: true })
  displayCode: string;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Index()
  @Column({ type: 'uuid' })
  walletId: string;

  @ManyToOne(() => Wallet)
  @JoinColumn({ name: 'walletId' })
  wallet: Wallet;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  organizationId?: string | null;

  @Column({ type: 'varchar', length: 32 })
  type: 'deposit' | 'withdrawal' | 'investment' | 'return' | 'fee' | 'reward' | 'inflow';

  @Column('numeric', { precision: 18, scale: 6, transformer: DecimalTransformer })
  amountUSDT: Decimal;

  @Column({ type: 'varchar', length: 32 })
  status: 'pending' | 'completed' | 'failed';

  @Column({ type: 'varchar', length: 64, nullable: true })
  referenceId?: string | null;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: any | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}


