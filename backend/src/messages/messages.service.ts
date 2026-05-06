import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';

function mapMessage(m: Message) {
  return {
    id: m.id,
    username: m.username,
    content: m.content,
    parentId: m.parentId,
    createdAt: m.createdAt.toISOString(),
  };
}

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly repo: Repository<Message>,
  ) {}

  async findAll(page = 1, limit = 50) {
    const [items, total] = await this.repo.findAndCount({
      where: { parentId: IsNull() },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      items: items.map(mapMessage),
      total,
      page,
      limit,
    };
  }

  async findReplies(parentId: string) {
    const items = await this.repo.find({
      where: { parentId },
      order: { createdAt: 'ASC' },
    });
    return items.map(mapMessage);
  }

  async create(dto: CreateMessageDto, ip: string | null) {
    const msg = this.repo.create({
      username: dto.username.trim(),
      content: dto.content.trim(),
      parentId: dto.parentId ?? null,
      ipAddress: ip,
    });
    const saved = await this.repo.save(msg);
    return mapMessage(saved);
  }
}
