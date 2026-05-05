import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostsService {
  constructor(@InjectRepository(Post) private readonly repo: Repository<Post>) {}

  async findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' }, take: 20 });
  }

  async create(dto: CreatePostDto) {
    const saved = await this.repo.save(this.repo.create(dto));
    return { ...saved, createdAt: saved.createdAt.toISOString() };
  }
}
