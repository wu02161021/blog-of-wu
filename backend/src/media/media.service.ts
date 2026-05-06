import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { extname } from 'path';
import { MediaImage } from './entities/media-image.entity';
import { MediaVideo } from './entities/media-video.entity';
import { CreateImageDto, CreateVideoDto, UpdateImageDto, UpdateVideoDto } from './dto/create-media.dto';
import { SupabaseStorageService } from './supabase-storage.service';

@Injectable()
export class MediaService {
  private static readonly adminEmail = '421766153@qq.com';

  constructor(
    @InjectRepository(MediaImage) private readonly imageRepo: Repository<MediaImage>,
    @InjectRepository(MediaVideo) private readonly videoRepo: Repository<MediaVideo>,
    private readonly storage: SupabaseStorageService,
  ) {}

  private requireAdmin(email: string | undefined) {
    if (email !== MediaService.adminEmail) {
      throw new UnauthorizedException('仅管理员可操作');
    }
  }

  private generateFilename(originalname: string): string {
    return Date.now() + '-' + Math.round(Math.random() * 1e9) + extname(originalname);
  }

  private toImageDto(img: MediaImage) {
    return { ...img, fileUrl: this.storage.getPublicUrl(img.fileName) };
  }

  private toVideoDto(vid: MediaVideo) {
    return { ...vid, fileUrl: this.storage.getPublicUrl(vid.fileName) };
  }

  /* ── Images ── */
  async listImages() {
    const items = await this.imageRepo.find({ order: { sortOrder: 'ASC' }, take: 20 });
    return items.map(i => this.toImageDto(i));
  }

  async createImage(email: string | undefined, dto: CreateImageDto, file?: Record<string, any>) {
    this.requireAdmin(email);
    if (!file) throw new BadRequestException('请选择图片文件');

    const filePath = 'images/' + this.generateFilename(file.originalname);
    await this.storage.upload(filePath, file.buffer, file.mimetype);

    const img = this.imageRepo.create({ title: dto.title, fileName: filePath, sortOrder: dto.sortOrder ?? 0 });
    const saved = await this.imageRepo.save(img);
    return this.toImageDto(saved);
  }

  async updateImage(email: string | undefined, id: string, dto: UpdateImageDto, file?: Record<string, any>) {
    this.requireAdmin(email);
    const img = await this.imageRepo.findOneBy({ id });
    if (!img) throw new BadRequestException('图片不存在');

    if (file) {
      await this.storage.delete(img.fileName);
      const filePath = 'images/' + this.generateFilename(file.originalname);
      await this.storage.upload(filePath, file.buffer, file.mimetype);
      img.fileName = filePath;
    }
    if (dto.title !== undefined) img.title = dto.title;
    if (dto.sortOrder !== undefined) img.sortOrder = dto.sortOrder;
    const saved = await this.imageRepo.save(img);
    return this.toImageDto(saved);
  }

  async deleteImage(email: string | undefined, id: string) {
    this.requireAdmin(email);
    const img = await this.imageRepo.findOneBy({ id });
    if (!img) throw new BadRequestException('图片不存在');
    await this.storage.delete(img.fileName);
    await this.imageRepo.remove(img);
    return { ok: true };
  }

  /* ── Videos ── */
  async listVideos() {
    const items = await this.videoRepo.find({ order: { sortOrder: 'ASC' }, take: 20 });
    return items.map(v => this.toVideoDto(v));
  }

  async createVideo(email: string | undefined, dto: CreateVideoDto, file?: Record<string, any>) {
    this.requireAdmin(email);
    if (!file) throw new BadRequestException('请选择视频文件');

    const filePath = 'videos/' + this.generateFilename(file.originalname);
    await this.storage.upload(filePath, file.buffer, file.mimetype);

    const vid = this.videoRepo.create({ title: dto.title, fileName: filePath, description: dto.description, duration: dto.duration, sortOrder: dto.sortOrder ?? 0 });
    const saved = await this.videoRepo.save(vid);
    return this.toVideoDto(saved);
  }

  async updateVideo(email: string | undefined, id: string, dto: UpdateVideoDto, file?: Record<string, any>) {
    this.requireAdmin(email);
    const vid = await this.videoRepo.findOneBy({ id });
    if (!vid) throw new BadRequestException('视频不存在');

    if (file) {
      await this.storage.delete(vid.fileName);
      const filePath = 'videos/' + this.generateFilename(file.originalname);
      await this.storage.upload(filePath, file.buffer, file.mimetype);
      vid.fileName = filePath;
    }
    if (dto.title !== undefined) vid.title = dto.title;
    if (dto.description !== undefined) vid.description = dto.description;
    if (dto.duration !== undefined) vid.duration = dto.duration;
    if (dto.sortOrder !== undefined) vid.sortOrder = dto.sortOrder;
    const saved = await this.videoRepo.save(vid);
    return this.toVideoDto(saved);
  }

  async deleteVideo(email: string | undefined, id: string) {
    this.requireAdmin(email);
    const vid = await this.videoRepo.findOneBy({ id });
    if (!vid) throw new BadRequestException('视频不存在');
    await this.storage.delete(vid.fileName);
    await this.videoRepo.remove(vid);
    return { ok: true };
  }
}
