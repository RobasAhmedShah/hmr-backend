import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { KycVerification } from './entities/kyc-verification.entity';
import { User } from '../admin/entities/user.entity';
import { CreateKycDto } from './dto/create-kyc.dto';
import { UpdateKycDto } from './dto/update-kyc.dto';
import type { KycVerifiedEvent } from '../events/kyc.events';

@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(KycVerification)
    private readonly kycRepo: Repository<KycVerification>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateKycDto) {
    return this.dataSource.transaction(async (manager) => {
      // Check if userId is UUID or displayCode
      const isUserIdUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dto.userId);
      
      let actualUserId = dto.userId;
      if (!isUserIdUuid) {
        // Find user by displayCode to get their UUID
        const user = await manager.findOne(User, { where: { displayCode: dto.userId } });
        if (!user) throw new NotFoundException('User not found');
        actualUserId = user.id;
      }

      // Check if user exists
      const user = await manager.findOne(User, { where: { id: actualUserId } });
      if (!user) throw new NotFoundException('User not found');

      // Check if KYC already exists for this user
      const existingKyc = await manager.findOne(KycVerification, { where: { userId: actualUserId } });
      
      if (existingKyc) {
        // Update existing KYC verification
        existingKyc.type = dto.type;
        existingKyc.documentFrontUrl = dto.documentFrontUrl;
        existingKyc.documentBackUrl = dto.documentBackUrl;
        existingKyc.selfieUrl = dto.selfieUrl;
        existingKyc.metadata = dto.metadata;
        existingKyc.submittedAt = new Date();
        // Keep status as 'pending' for new submission
        existingKyc.status = 'pending';
        existingKyc.reviewer = null;
        existingKyc.rejectionReason = null;
        existingKyc.reviewedAt = null;

        const savedKyc = await manager.save(KycVerification, existingKyc);
        this.logger.log(`KYC verification updated for user ${user.displayCode}`);
        return savedKyc;
      }

      // Create new KYC verification (fallback for edge cases)
      const kycVerification = manager.create(KycVerification, {
        userId: actualUserId,
        type: dto.type,
        status: 'pending',
        documentFrontUrl: dto.documentFrontUrl,
        documentBackUrl: dto.documentBackUrl,
        selfieUrl: dto.selfieUrl,
        metadata: dto.metadata,
        submittedAt: new Date(),
      });

      const savedKyc = await manager.save(KycVerification, kycVerification);

      this.logger.log(`KYC verification created for user ${user.displayCode}`);

      return savedKyc;
    });
  }

  async update(id: string, dto: UpdateKycDto) {
    return this.dataSource.transaction(async (manager) => {
      // Check if id is UUID or displayCode (for user lookup)
      const isIdUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      
      let kyc: KycVerification | null;
      
      if (isIdUuid) {
        // Direct KYC ID lookup
        kyc = await manager.findOne(KycVerification, {
          where: { id },
          relations: ['user'],
        });
      } else {
        // Find user by displayCode, then find their KYC
        const user = await manager.findOne(User, { where: { displayCode: id } });
        if (!user) {
          throw new NotFoundException('User not found');
        }
        kyc = await manager.findOne(KycVerification, {
          where: { userId: user.id },
          relations: ['user'],
          order: { createdAt: 'DESC' }
        });
      }

      if (!kyc) {
        throw new NotFoundException('KYC verification not found');
      }

      // Update KYC fields dynamically
      if (dto.type !== undefined) {
        kyc.type = dto.type;
      }
      if (dto.status !== undefined) {
        kyc.status = dto.status;
      }
      if (dto.documentFrontUrl !== undefined) {
        kyc.documentFrontUrl = dto.documentFrontUrl;
      }
      if (dto.documentBackUrl !== undefined) {
        kyc.documentBackUrl = dto.documentBackUrl;
      }
      if (dto.selfieUrl !== undefined) {
        kyc.selfieUrl = dto.selfieUrl;
      }
      if (dto.reviewer !== undefined) {
        kyc.reviewer = dto.reviewer;
      }
      if (dto.rejectionReason !== undefined) {
        kyc.rejectionReason = dto.rejectionReason;
      }
      if (dto.metadata !== undefined) {
        kyc.metadata = dto.metadata;
      }

      // Set reviewedAt if status is being changed to verified or rejected
      if (dto.status === 'verified' || dto.status === 'rejected') {
        kyc.reviewedAt = new Date();
      }

      const updatedKyc = await manager.save(KycVerification, kyc);

      // Emit KYC verified event if status changed to verified
      if (dto.status === 'verified') {
        const kycVerifiedEvent: KycVerifiedEvent = {
          eventId: `kyc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          userId: kyc.userId,
          userDisplayCode: kyc.user.displayCode,
          kycId: kyc.id,
          status: 'verified',
          verificationDate: kyc.reviewedAt || new Date(),
        };

        try {
          this.eventEmitter.emit('kyc.verified', kycVerifiedEvent);
          this.logger.log(`KYC verified event emitted for user ${kyc.user.displayCode}`);
        } catch (error) {
          this.logger.error('Failed to emit KYC verified event:', error);
          // Don't throw - let the main operation continue
        }
      }

      this.logger.log(`KYC verification updated for user ${kyc.user.displayCode}`);

      return updatedKyc;
    });
  }

  async findByUserId(userId: string) {
    // Check if userId is UUID or displayCode
    const isUserIdUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    
    if (isUserIdUuid) {
      return this.kycRepo.findOne({ 
        where: { userId },
        relations: ['user'],
        order: { createdAt: 'DESC' }
      });
    } else {
      // Find user by displayCode to get their UUID, then find KYC
      const user = await this.dataSource.getRepository(User).findOne({ where: { displayCode: userId } });
      if (!user) return null;
      return this.kycRepo.findOne({ 
        where: { userId: user.id },
        relations: ['user'],
        order: { createdAt: 'DESC' }
      });
    }
  }

  async findOne(id: string) {
    // Check if id is UUID or displayCode (for user lookup)
    const isIdUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    if (isIdUuid) {
      // Direct KYC ID lookup
      return this.kycRepo.findOne({ 
        where: { id }, 
        relations: ['user'] 
      });
    } else {
      // Find user by displayCode, then find their KYC
      const user = await this.dataSource.getRepository(User).findOne({ where: { displayCode: id } });
      if (!user) return null;
      return this.kycRepo.findOne({ 
        where: { userId: user.id },
        relations: ['user'],
        order: { createdAt: 'DESC' }
      });
    }
  }

  async findAll() {
    return this.kycRepo.find({ 
      relations: ['user'],
      order: { createdAt: 'DESC' }
    });
  }
}


