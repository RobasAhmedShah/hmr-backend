import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { DecimalTransformer } from '../../common/decimal.transformer';
import Decimal from 'decimal.js';
import { Organization } from '../../organizations/entities/organization.entity';

@Entity('properties')
export class Property {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 32, unique: true })
  displayCode: string;

  @Index()
  @Column({ type: 'uuid' })
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'varchar', length: 32 })
  type: 'residential' | 'commercial' | 'mixed';

  @Column({ type: 'varchar', length: 32 })
  status: 'planning' | 'construction' | 'active' | 'onhold' | 'soldout' | 'completed';

  @Column('numeric', { precision: 18, scale: 6, transformer: DecimalTransformer })
  totalValueUSDT: Decimal;

  @Column('numeric', { precision: 18, scale: 6, transformer: DecimalTransformer })
  totalTokens: Decimal;

  @Column('numeric', { precision: 18, scale: 6, transformer: DecimalTransformer })
  availableTokens: Decimal;

  @Column('numeric', { precision: 18, scale: 6, transformer: DecimalTransformer })
  pricePerTokenUSDT: Decimal;

  @Column('numeric', { precision: 5, scale: 2, transformer: DecimalTransformer })
  expectedROI: Decimal;

  @Column({ type: 'varchar', length: 128, nullable: true })
  city?: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  country?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  features?: any | null;

  @Column({ type: 'jsonb', nullable: true })
  images?: any | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}


