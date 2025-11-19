import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { DecimalTransformer } from '../../common/decimal.transformer';
import Decimal from 'decimal.js';
import { User } from '../../admin/entities/user.entity';

@Entity('portfolio')
export class Portfolio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('numeric', { precision: 18, scale: 6, transformer: DecimalTransformer, default: 0 })
  totalInvestedUSDT: Decimal;

  @Column('numeric', { precision: 18, scale: 6, transformer: DecimalTransformer, default: 0 })
  totalRewardsUSDT: Decimal;

  @Column('numeric', { precision: 18, scale: 6, transformer: DecimalTransformer, default: 0 })
  totalROIUSDT: Decimal;

  @Column({ type: 'integer', default: 0 })
  activeInvestments: number;

  @Column({ type: 'timestamptz', nullable: true })
  lastUpdated?: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}


