import 'reflect-metadata';
import { config as loadDotenv } from 'dotenv';
import { join } from 'node:path';

// .env kök dizinde (git dışı). Sunucuda PM2 zaten ortamı verir; dosya varsa okunur.
loadDotenv({ path: join(__dirname, '..', '..', '..', '.env') });

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const { env } = await import('./common/env');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // nginx arkasında: gerçek istemci IP'si (rate limit + audit için)
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(helmet());
  app.setGlobalPrefix('v1');
  app.enableCors({ origin: [env.APP_URL], credentials: false });
  app.enableShutdownHooks();

  await app.listen(env.API_PORT, '127.0.0.1');
  new Logger('Mettlo').log(`API http://127.0.0.1:${env.API_PORT}/v1`);
}
bootstrap();
