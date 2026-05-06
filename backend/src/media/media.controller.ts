import {
  Body, Controller, Delete, Get, Param, Post, Put, Req,
  UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MediaService } from './media.service';
import { CreateImageDto, CreateVideoDto, UpdateImageDto, UpdateVideoDto } from './dto/create-media.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface AuthReq {
  user?: { sub?: string; email?: string };
}

const imageUpload = { storage: memoryStorage() };
const videoUpload = { storage: memoryStorage() };

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  /* ── Images ── */
  @Get('images')
  listImages() {
    return this.mediaService.listImages();
  }

  @Post('images')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', imageUpload))
  createImage(@Req() req: AuthReq, @UploadedFile() file: any, @Body() dto: CreateImageDto) {
    return this.mediaService.createImage(req.user?.email, dto, file);
  }

  @Put('images/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', imageUpload))
  updateImage(@Req() req: AuthReq, @Param('id') id: string, @UploadedFile() file: any, @Body() dto: UpdateImageDto) {
    return this.mediaService.updateImage(req.user?.email, id, dto, file);
  }

  @Delete('images/:id')
  @UseGuards(JwtAuthGuard)
  deleteImage(@Req() req: AuthReq, @Param('id') id: string) {
    return this.mediaService.deleteImage(req.user?.email, id);
  }

  /* ── Videos ── */
  @Get('videos')
  listVideos() {
    return this.mediaService.listVideos();
  }

  @Post('videos')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', videoUpload))
  createVideo(@Req() req: AuthReq, @UploadedFile() file: any, @Body() dto: CreateVideoDto) {
    return this.mediaService.createVideo(req.user?.email, dto, file);
  }

  @Put('videos/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', videoUpload))
  updateVideo(@Req() req: AuthReq, @Param('id') id: string, @UploadedFile() file: any, @Body() dto: UpdateVideoDto) {
    return this.mediaService.updateVideo(req.user?.email, id, dto, file);
  }

  @Delete('videos/:id')
  @UseGuards(JwtAuthGuard)
  deleteVideo(@Req() req: AuthReq, @Param('id') id: string) {
    return this.mediaService.deleteVideo(req.user?.email, id);
  }
}
