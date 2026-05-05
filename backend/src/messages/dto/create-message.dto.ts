import { IsString, Length } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @Length(1, 60)
  username: string;

  @IsString()
  @Length(1, 1000)
  content: string;
}
