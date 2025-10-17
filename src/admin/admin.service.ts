import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import Decimal from 'decimal.js';
import { User } from './entities/user.entity';
import { Wallet } from '../wallet/entities/wallet.entity';

@Injectable()
export class AdminService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
  ) {}

  findAll() {
    return this.userRepository.find();
  }

  async create(data: Partial<User>) {
    return this.dataSource.transaction(async (manager) => {
      const users = manager.getRepository(User);
      const wallets = manager.getRepository(Wallet);
      
      // Generate displayCode using sequence
      const result = await users.query('SELECT nextval(\'user_display_seq\') as nextval');
      const displayCode = `USR-${result[0].nextval.toString().padStart(6, '0')}`;
      
      const user = users.create({
        fullName: data.fullName ?? (data as any).name,
        email: data.email!,
        phone: (data as any).phone ?? null,
        role: (data.role as any) ?? 'user',
        isActive: (data as any).isActive ?? true,
        displayCode,
      });
      const saved = await users.save(user);
      const wallet = wallets.create({ 
        userId: saved.id,
        balanceUSDT: new Decimal(0),
        lockedUSDT: new Decimal(0),
        totalDepositedUSDT: new Decimal(0),
        totalWithdrawnUSDT: new Decimal(0),
      });
      await wallets.save(wallet);
      return saved;
    });
  }
}


