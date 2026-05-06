import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { AuthModule } from './auth/auth.module';
import { MessagesModule } from './messages/messages.module';
import { MediaModule } from './media/media.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PostsModule } from './posts/posts.module';
import { AppController } from './app.controller';

const envCandidates = [path.resolve(process.cwd(), '.env'), path.resolve(process.cwd(), 'backend/.env')];
envCandidates.forEach((envPath) => {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false });
  }
});

const dbHost = String(process.env.DB_HOST ?? '127.0.0.1');
const dbPort = Number(process.env.DB_PORT ?? 5432);
const dbUser = String(process.env.DB_USER ?? 'postgres');
const dbPassword = Buffer.from(String(process.env.DB_PASSWORD ?? ''), 'utf8').toString('utf8');
const dbName = String(process.env.DB_NAME ?? 'solar_auth');
const dbSync = String(process.env.DB_SYNC ?? 'false') === 'true';
const dbUrl = `postgres://${encodeURIComponent(dbUser)}:${encodeURIComponent(dbPassword)}@${dbHost}:${dbPort}/${dbName}`;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [path.resolve(process.cwd(), '.env'), path.resolve(process.cwd(), 'backend/.env')],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: dbUrl,
      autoLoadEntities: true,
      synchronize: dbSync,
      ssl: {
        rejectUnauthorized: false,
      },
    }),
    AuthModule,
    MessagesModule,
    MediaModule,
    NotificationsModule,
    PostsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
