import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../admin/entities/user.entity';

@Entity('kyc_verifications')
export class KycVerification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 32 })
  type: 'cnic' | 'passport' | 'license' | 'other';

  @Column({ type: 'varchar', length: 32, default: 'pending' })
  status: 'pending' | 'verified' | 'rejected';

  @Column({ type: 'varchar', length: 512 })
  documentFrontUrl: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  documentBackUrl?: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  selfieUrl?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reviewer?: string | null;

  @Column({ type: 'text', nullable: true })
  rejectionReason?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: any | null;

  @Column({ type: 'timestamptz', nullable: true })
  submittedAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  reviewedAt?: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}


