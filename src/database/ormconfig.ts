// src/database/ormconfig.ts
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

const config: TypeOrmModuleOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: true,
  autoLoadEntities: true,
  // Disable synchronize in production - use migrations instead
  synchronize: process.env.NODE_ENV !== 'production',
  extra: {
    ssl: { rejectUnauthorized: false },
  },
};

export default config;
