import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly repo: Repository<Message>,
  ) {}

  async findAll(page = 1, limit = 50) {
    const [items, total] = await this.repo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      items: items.map((m) => ({
        id: m.id,
        username: m.username,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
    };
  }

  async create(dto: CreateMessageDto, ip: string | null) {
    const msg = this.repo.create({
      username: dto.username.trim(),
      content: dto.content.trim(),
      ipAddress: ip,
    });
    const saved = await this.repo.save(msg);
    return {
      id: saved.id,
      username: saved.username,
      content: saved.content,
      createdAt: saved.createdAt.toISOString(),
    };
  }
}
