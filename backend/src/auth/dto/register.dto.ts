import { IsEmail, IsString, Length, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @Length(64, 64)
  @Matches(/^[a-f0-9]+$/i, { message: '滑动验证票据无效' })
  captchaTicket: string;
}
