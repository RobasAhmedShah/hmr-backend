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
    new FastifyAdapter(fastifyInstance),
    {
      snapshot: true,
    }
  );

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  
  // Comprehensive CORS configuration for production deployment
  app.enableCors({
    origin: true, // Allow all origins in production
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'Accept', 
      'Origin', 
      'X-Requested-With',
      'Access-Control-Allow-Origin',
      'Access-Control-Allow-Headers',
      'Access-Control-Allow-Methods'
    ],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
  });

  // Additional CORS handling for serverless environments
  const fastifyApp = app.getHttpAdapter().getInstance();
  fastifyApp.addHook('onRequest', async (request, reply) => {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      reply.header('Access-Control-Allow-Origin', '*');
      reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD');
      reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
      reply.header('Access-Control-Max-Age', '86400');
      reply.code(204).send();
      return;
    }
    
    // Add CORS headers to all responses
    reply.header('Access-Control-Allow-Origin', '*');
    reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD');
    reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
  });

  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  cachedApp = app;
  return app;
}

// Default export for Vercel serverless function
export default async function handler(req: any, res: any) {
  // Handle CORS preflight requests at the serverless level
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.status(204).end();
    return;
  }

  const app = await createNestApp();
  const fastifyInstance = app.getHttpAdapter().getInstance();

  // Add CORS headers to all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
  
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
