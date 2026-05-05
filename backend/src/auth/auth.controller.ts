import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CaptchaService } from './captcha.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifySlideCaptchaDto } from './dto/verify-slide-captcha.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateThemeDto } from './dto/update-theme.dto';
import { TrackVisitDto } from './dto/track-visit.dto';
import { ReviewUserDto } from './dto/review-user.dto';
import { DeleteUserDto } from './dto/delete-user.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly captchaService: CaptchaService,
  ) {}

  @Post('captcha')
  createCaptcha() {
    return this.captchaService.create();
  }

  @Post('captcha/verify')
  verifyCaptcha(@Body() payload: VerifySlideCaptchaDto) {
    return this.captchaService.verify(payload);
  }

  @Post('register')
  register(@Body() payload: RegisterDto) {
    return this.authService.register(payload);
  }

  @Post('login')
  login(@Body() payload: LoginDto) {
    return this.authService.login(payload);
  }

  @Post('track')
  trackVisit(@Body() payload: TrackVisitDto, @Req() req: Request & { user?: { sub?: string } }) {
    return this.authService.trackVisit(payload, req.user?.sub ?? null, req);
  }

  @Post('forgot-password')
  forgotPassword(@Body() payload: ForgotPasswordDto) {
    return this.authService.forgotPassword(payload);
  }

  @Post('reset-password')
  resetPassword(@Body() payload: ResetPasswordDto) {
    return this.authService.resetPassword(payload);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(@Req() req: { user?: { sub?: string } }, @Body() payload: ChangePasswordDto) {
    if (!req.user?.sub) {
      throw new UnauthorizedException('登录状态无效');
    }
    return this.authService.changePassword(req.user.sub, payload);
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  async dashboard(@Req() req: { user?: { sub?: string } }) {
    if (!req.user?.sub) {
      throw new UnauthorizedException('登录状态无效');
    }
    return this.authService.dashboard(req.user.sub);
  }

  @Post('theme')
  @UseGuards(JwtAuthGuard)
  async updateTheme(@Req() req: { user?: { sub?: string } }, @Body() payload: UpdateThemeDto) {
    if (!req.user?.sub) {
      throw new UnauthorizedException('登录状态无效');
    }
    return this.authService.updateTheme(req.user.sub, payload.theme);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async profile(@Req() req: { user?: { sub?: string } }) {
    if (!req.user?.sub) {
      throw new UnauthorizedException('登录状态无效');
    }
    return this.authService.profile(req.user.sub);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard)
  async users(@Req() req: { user?: { sub?: string } }) {
    if (!req.user?.sub) {
      throw new UnauthorizedException('登录状态无效');
    }
    return this.authService.listUsers(req.user.sub);
  }

  @Post('users/review')
  @UseGuards(JwtAuthGuard)
  async reviewUser(@Req() req: { user?: { sub?: string } }, @Body() payload: ReviewUserDto) {
    if (!req.user?.sub) {
      throw new UnauthorizedException('登录状态无效');
    }
    return this.authService.reviewUser(req.user.sub, payload);
  }

  @Post('users/delete')
  @UseGuards(JwtAuthGuard)
  async deleteUser(@Req() req: { user?: { sub?: string } }, @Body() payload: DeleteUserDto) {
    if (!req.user?.sub) {
      throw new UnauthorizedException('登录状态无效');
    }
    return this.authService.deleteUser(req.user.sub, payload.userId);
  }
}
