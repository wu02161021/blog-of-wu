import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseStorageService {
  private supabase: SupabaseClient;
  private bucket: string;
  private readonly logger = new Logger(SupabaseStorageService.name);

  constructor(private config: ConfigService) {
    const url = this.config.get<string>('SUPABASE_URL');
    const key = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    this.bucket = this.config.get<string>('SUPABASE_STORAGE_BUCKET', 'media');

    if (!url || !key) {
      this.logger.warn('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set — file uploads will fail');
      return;
    }
    this.supabase = createClient(url, key, {
      auth: { persistSession: false },
    });
  }

  private ensureClient(): SupabaseClient {
    if (!this.supabase) {
      throw new InternalServerErrorException('Supabase Storage 未配置，请联系管理员设置 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY');
    }
    return this.supabase;
  }

  async upload(filePath: string, buffer: Buffer, mimetype: string) {
    const { error } = await this.ensureClient().storage
      .from(this.bucket)
      .upload(filePath, buffer, { contentType: mimetype, upsert: false });

    if (error) throw error;
  }

  getPublicUrl(filePath: string): string {
    return this.ensureClient().storage.from(this.bucket).getPublicUrl(filePath).data.publicUrl;
  }

  async delete(filePath: string) {
    const { error } = await this.ensureClient().storage.from(this.bucket).remove([filePath]);
    if (error) this.logger.warn(`Failed to delete ${filePath}: ${error.message}`);
  }
}
