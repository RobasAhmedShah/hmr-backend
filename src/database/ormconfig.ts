// src/database/ormconfig.ts
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

const config: TypeOrmModuleOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,  // Neon connection string
  ssl: true,                      // Neon requires SSL
  autoLoadEntities: true,         // automatically load entities from modules
  synchronize: true,              // only for development; disable in prod
};

export default config;
