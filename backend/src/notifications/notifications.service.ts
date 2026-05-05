import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  private static readonly adminEmail = '421766153@qq.com';

  constructor(
    @InjectRepository(Notification) private readonly repo: Repository<Notification>,
  ) {}

  async findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' }, take: 20 });
  }

  async create(email: string | undefined, dto: CreateNotificationDto) {
    if (email !== NotificationsService.adminEmail) {
      throw new UnauthorizedException('仅管理员可操作');
    }
    const saved = await this.repo.save(this.repo.create(dto));
    return { ...saved, createdAt: saved.createdAt.toISOString() };
  }

  async delete(email: string | undefined, id: string) {
    if (email !== NotificationsService.adminEmail) {
      throw new UnauthorizedException('仅管理员可操作');
    }
    await this.repo.delete(id);
    return { ok: true };
  }
}
