import { IsInt, IsOptional, IsString, Length } from 'class-validator';

export class CreateImageDto {
  @IsString() @Length(1, 200)
  title: string;

  @IsOptional() @IsInt()
  sortOrder?: number;
}

export class UpdateImageDto {
  @IsOptional() @IsString() @Length(1, 200)
  title?: string;

  @IsOptional() @IsInt()
  sortOrder?: number;
}

export class CreateVideoDto {
  @IsString() @Length(1, 200)
  title: string;

  @IsOptional() @IsString() @Length(0, 300)
  description?: string;

  @IsOptional() @IsString() @Length(0, 20)
  duration?: string;

  @IsOptional() @IsInt()
  sortOrder?: number;
}

export class UpdateVideoDto {
  @IsOptional() @IsString() @Length(1, 200)
  title?: string;

  @IsOptional() @IsString() @Length(0, 300)
  description?: string;

  @IsOptional() @IsString() @Length(0, 20)
  duration?: string;

  @IsOptional() @IsInt()
  sortOrder?: number;
}
