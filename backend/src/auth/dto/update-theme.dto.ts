import { IsIn } from 'class-validator';

export class UpdateThemeDto {
  @IsIn(['dark', 'light'])
  theme: 'dark' | 'light';
}
