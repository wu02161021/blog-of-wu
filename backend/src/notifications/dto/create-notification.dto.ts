import { IsString, Length } from 'class-validator';

export class CreateNotificationDto {
  @IsString() @Length(1, 20)
  type: string;

  @IsString() @Length(1, 500)
  content: string;
}
