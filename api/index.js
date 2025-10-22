const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');

let cachedApp;

async function createApp() {
  if (cachedApp) {
    return cachedApp;
  }

  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for Vercel
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Global prefix for API routes
  app.setGlobalPrefix('api');

  await app.init();
  cachedApp = app;
  return app;
}

module.exports = async (req, res) => {
  const app = await createApp();
  const server = app.getHttpAdapter().getInstance();
  server(req, res);
};
