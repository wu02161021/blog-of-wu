import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface AuthReq { user?: { email?: string } }

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Req() req: AuthReq, @Body() dto: CreateNotificationDto) {
    return this.service.create(req.user?.email, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  delete(@Req() req: AuthReq, @Param('id') id: string) {
    return this.service.delete(req.user?.email, id);
  }
}
