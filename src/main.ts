// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import fastify from 'fastify';
import { AppModule } from './app.module';
import { injectSpeedInsights } from '@vercel/speed-insights';


let cachedApp: NestFastifyApplication | null = null;

async function createNestApp(): Promise<NestFastifyApplication> {
  if (cachedApp) return cachedApp;

  const fastifyInstance = fastify({ logger: false });

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(fastifyInstance)
  );

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.enableCors();

  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  cachedApp = app;
  return app;
}

// Default export for Vercel serverless function
export default async function handler(req: any, res: any) {
  const app = await createNestApp();
  const fastifyInstance = app.getHttpAdapter().getInstance();

  
  injectSpeedInsights();



  // Forward request to Fastify server
  fastifyInstance.server.emit('request', req, res);
 
}

// Also, bootstrap locally if not in production (optional)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  async function bootstrap() {
    const app = await createNestApp();
    await app.listen(process.env.PORT || 3000, '0.0.0.0');
    console.log(`🚀 App listening on port ${process.env.PORT || 3000}`);
  }
  bootstrap();
}
