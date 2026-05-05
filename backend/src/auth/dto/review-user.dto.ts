import { IsIn, IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class ReviewUserDto {
  @IsUUID('4')
  userId: string;

  @IsIn(['approved', 'rejected'])
  status: 'approved' | 'rejected';

  @IsOptional()
  @IsString()
  @Length(0, 255)
  note?: string;
}
