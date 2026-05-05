import { IsOptional, IsString, Length } from 'class-validator';

export class CreatePostDto {
  @IsString() @Length(1, 60)
  username: string;

  @IsString() @Length(1, 200)
  title: string;

  @IsString() @Length(1, 5000)
  content: string;

  @IsOptional() @IsString() @Length(1, 20)
  tag?: string;
}
