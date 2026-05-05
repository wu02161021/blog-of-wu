import {
  Body, Controller, Delete, Get, Param, Post, Put, Req,
  UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { MediaService } from './media.service';
import { CreateImageDto, CreateVideoDto, UpdateImageDto, UpdateVideoDto } from './dto/create-media.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface AuthReq {
  user?: { sub?: string; email?: string };
}

const imageStorage = diskStorage({
  destination: join(process.cwd(), 'uploads', 'images'),
  filename: (_req, file, cb) => {
    const name = Date.now() + '-' + Math.round(Math.random() * 1e9) + extname(file.originalname);
    cb(null, name);
  },
});

const videoStorage = diskStorage({
  destination: join(process.cwd(), 'uploads', 'videos'),
  filename: (_req, file, cb) => {
    const name = Date.now() + '-' + Math.round(Math.random() * 1e9) + extname(file.originalname);
    cb(null, name);
  },
});

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
  @UseInterceptors(FileInterceptor('file', { storage: imageStorage }))
  createImage(@Req() req: AuthReq, @UploadedFile() file: any, @Body() dto: CreateImageDto) {
    return this.mediaService.createImage(req.user?.email, dto, file);
  }

  @Put('images/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', { storage: imageStorage }))
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
  @UseInterceptors(FileInterceptor('file', { storage: videoStorage }))
  createVideo(@Req() req: AuthReq, @UploadedFile() file: any, @Body() dto: CreateVideoDto) {
    return this.mediaService.createVideo(req.user?.email, dto, file);
  }

  @Put('videos/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', { storage: videoStorage }))
  updateVideo(@Req() req: AuthReq, @Param('id') id: string, @UploadedFile() file: any, @Body() dto: UpdateVideoDto) {
    return this.mediaService.updateVideo(req.user?.email, id, dto, file);
  }

  @Delete('videos/:id')
  @UseGuards(JwtAuthGuard)
  deleteVideo(@Req() req: AuthReq, @Param('id') id: string) {
    return this.mediaService.deleteVideo(req.user?.email, id);
  }
}
