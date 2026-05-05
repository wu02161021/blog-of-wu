import { IsNumber, IsUUID, Max, Min } from 'class-validator';

export class VerifySlideCaptchaDto {
  @IsUUID('4')
  captchaId: string;

  @IsNumber()
  @Min(0)
  @Max(400)
  sliderCenterPx: number;
}
