import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { MediaImage } from './entities/media-image.entity';
import { MediaVideo } from './entities/media-video.entity';
import { CreateImageDto, CreateVideoDto, UpdateImageDto, UpdateVideoDto } from './dto/create-media.dto';

@Injectable()
export class MediaService {
  private static readonly adminEmail = '421766153@qq.com';

  constructor(
    @InjectRepository(MediaImage) private readonly imageRepo: Repository<MediaImage>,
    @InjectRepository(MediaVideo) private readonly videoRepo: Repository<MediaVideo>,
  ) {}

  private requireAdmin(email: string | undefined) {
    if (email !== MediaService.adminEmail) {
      throw new UnauthorizedException('仅管理员可操作');
    }
  }

  private toImageDto(img: MediaImage) {
    return { ...img, fileUrl: '/uploads/images/' + img.fileName };
  }

  private toVideoDto(vid: MediaVideo) {
    return { ...vid, fileUrl: '/uploads/videos/' + vid.fileName };
  }

  /* ── Images ── */
  async listImages() {
    const items = await this.imageRepo.find({ order: { sortOrder: 'ASC' }, take: 20 });
    return items.map(i => this.toImageDto(i));
  }

  async createImage(email: string | undefined, dto: CreateImageDto, file?: Record<string, any>) {
    this.requireAdmin(email);
    if (!file) throw new BadRequestException('请选择图片文件');
    const img = this.imageRepo.create({ title: dto.title, fileName: file.filename, sortOrder: dto.sortOrder ?? 0 });
    const saved = await this.imageRepo.save(img);
    return this.toImageDto(saved);
  }

  async updateImage(email: string | undefined, id: string, dto: UpdateImageDto, file?: Record<string, any>) {
    this.requireAdmin(email);
    const img = await this.imageRepo.findOneBy({ id });
    if (!img) throw new BadRequestException('图片不存在');

    if (file) {
      // delete old file
      const oldPath = join(process.cwd(), 'uploads', 'images', img.fileName);
      if (existsSync(oldPath)) unlinkSync(oldPath);
      img.fileName = file.filename;
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
    const filePath = join(process.cwd(), 'uploads', 'images', img.fileName);
    if (existsSync(filePath)) unlinkSync(filePath);
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
    const vid = this.videoRepo.create({ title: dto.title, fileName: file.filename, description: dto.description, duration: dto.duration, sortOrder: dto.sortOrder ?? 0 });
    const saved = await this.videoRepo.save(vid);
    return this.toVideoDto(saved);
  }

  async updateVideo(email: string | undefined, id: string, dto: UpdateVideoDto, file?: Record<string, any>) {
    this.requireAdmin(email);
    const vid = await this.videoRepo.findOneBy({ id });
    if (!vid) throw new BadRequestException('视频不存在');

    if (file) {
      const oldPath = join(process.cwd(), 'uploads', 'videos', vid.fileName);
      if (existsSync(oldPath)) unlinkSync(oldPath);
      vid.fileName = file.filename;
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
    const filePath = join(process.cwd(), 'uploads', 'videos', vid.fileName);
    if (existsSync(filePath)) unlinkSync(filePath);
    await this.videoRepo.remove(vid);
    return { ok: true };
  }
}
