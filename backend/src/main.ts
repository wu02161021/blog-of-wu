import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

dotenv.config({ path: '.env', override: true });

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.set('trust proxy', true);
  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  // Force UTF-8 charset for all responses
  app.use((_req, res, next) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    next();
  });
  app.setGlobalPrefix('api');

  // Serve uploaded files
  const uploadsPath = join(process.cwd(), 'uploads');
  const imagesPath = join(uploadsPath, 'images');
  const videosPath = join(uploadsPath, 'videos');
  if (!existsSync(imagesPath)) mkdirSync(imagesPath, { recursive: true });
  if (!existsSync(videosPath)) mkdirSync(videosPath, { recursive: true });
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.use('/uploads', (await import('express')).static(uploadsPath));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
