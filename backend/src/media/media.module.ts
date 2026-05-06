import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaImage } from './entities/media-image.entity';
import { MediaVideo } from './entities/media-video.entity';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { SupabaseStorageService } from './supabase-storage.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([MediaImage, MediaVideo]), AuthModule],
  controllers: [MediaController],
  providers: [MediaService, SupabaseStorageService],
})
export class MediaModule {}
