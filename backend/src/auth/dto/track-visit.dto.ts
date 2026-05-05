import { IsIn, IsOptional, IsString, Length, Max, Min } from 'class-validator';

const EVENT_TYPES = ['SITE_ENTER', 'ROUTE_VIEW', 'LOGIN', 'REGISTER', 'LOGOUT'] as const;

export class TrackVisitDto {
  @IsString()
  @Length(6, 64)
  visitorId: string;

  @IsIn(EVENT_TYPES)
  eventType: (typeof EVENT_TYPES)[number];

  @IsOptional()
  @IsString()
  @Length(0, 255)
  routePath?: string;

  @IsOptional()
  @IsString()
  @Length(0, 20)
  deviceType?: string;

  @IsOptional()
  @IsString()
  @Length(0, 32)
  browserName?: string;

  @IsOptional()
  @IsString()
  @Length(0, 80)
  source?: string;

  @IsOptional()
  @Min(0)
  @Max(60 * 60 * 4)
  durationSeconds?: number;
}
