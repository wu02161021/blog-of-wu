import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { SlideCaptcha } from './entities/slide-captcha.entity';
import { AuthOperationLog } from './entities/auth-operation-log.entity';
import { VisitEvent } from './entities/visit-event.entity';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CaptchaService } from './captcha.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User, SlideCaptcha, AuthOperationLog, VisitEvent]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'dev_secret_change_me'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN', '1h') as StringValue },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, CaptchaService, JwtAuthGuard],
  exports: [AuthService, JwtAuthGuard, JwtModule],
})
export class AuthModule {}
