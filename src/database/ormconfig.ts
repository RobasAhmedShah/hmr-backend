// src/database/ormconfig.ts
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

const config: TypeOrmModuleOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: true,
  autoLoadEntities: true,
  synchronize: true,
  extra: {
    ssl: { rejectUnauthorized: false },
  },
};

export default config;
