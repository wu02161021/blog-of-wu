import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import type { Request } from 'express';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  findAll(@Query('page') page?: string) {
    return this.messagesService.findAll(Number(page) || 1);
  }

  @Get(':id/replies')
  findReplies(@Param('id') id: string) {
    return this.messagesService.findReplies(id);
  }

  @Post()
  create(@Body() dto: CreateMessageDto, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      || req.socket?.remoteAddress
      || null;
    return this.messagesService.create(dto, ip);
  }
}
