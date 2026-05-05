import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { SlideCaptcha } from './entities/slide-captcha.entity';
import { VerifySlideCaptchaDto } from './dto/verify-slide-captcha.dto';

const CAPTCHA_TTL_MS = 5 * 60 * 1000;
const TRACK_INNER_WIDTH = 280;
const KNOB_RADIUS = 22;
const TOLERANCE_PX = 12;

@Injectable()
export class CaptchaService {
  constructor(
    @InjectRepository(SlideCaptcha)
    private readonly captchaRepository: Repository<SlideCaptcha>,
  ) {}

  async create() {
    await this.captchaRepository.delete({ expiresAt: LessThan(new Date()) });

    const margin = KNOB_RADIUS + 6;
    /** 与前端「右侧校验刻度」对齐，避免随机目标不可见 */
    const targetXPx = TRACK_INNER_WIDTH - margin;

    const row = this.captchaRepository.create({
      targetXPx,
      trackInnerWidthPx: TRACK_INNER_WIDTH,
      knobRadiusPx: KNOB_RADIUS,
      tolerancePx: TOLERANCE_PX,
      expiresAt: new Date(Date.now() + CAPTCHA_TTL_MS),
    });
    const saved = await this.captchaRepository.save(row);

    return {
      captchaId: saved.id,
      trackInnerWidthPx: saved.trackInnerWidthPx,
      knobRadiusPx: saved.knobRadiusPx,
      expiresInSeconds: Math.floor(CAPTCHA_TTL_MS / 1000),
    };
  }

  async verify(payload: VerifySlideCaptchaDto) {
    const row = await this.captchaRepository.findOne({ where: { id: payload.captchaId } });
    if (!row) {
      throw new BadRequestException('验证码不存在');
    }
    if (row.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('验证码已过期');
    }
    if (row.verifyTicket) {
      throw new BadRequestException('验证码已使用');
    }
    if (row.consumedAt) {
      throw new BadRequestException('验证码已失效');
    }

    const x = Math.round(Number(payload.sliderCenterPx));
    if (Number.isNaN(x) || x < 0 || x > row.trackInnerWidthPx + row.knobRadiusPx * 2) {
      throw new BadRequestException('滑块位置无效');
    }

    if (Math.abs(x - row.targetXPx) > row.tolerancePx) {
      throw new BadRequestException('滑块未对准，请重试');
    }

    const ticket = randomBytes(32).toString('hex');
    row.verifyTicket = ticket;
    await this.captchaRepository.save(row);

    return { ticket };
  }

  async assertTicketUsable(ticket: string): Promise<SlideCaptcha> {
    const row = await this.captchaRepository.findOne({ where: { verifyTicket: ticket } });
    if (!row) {
      throw new BadRequestException('请先完成滑动验证');
    }
    if (row.consumedAt) {
      throw new BadRequestException('验证已使用，请重新验证');
    }
    if (row.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('验证已过期，请重新验证');
    }
    return row;
  }

  async consumeTicket(row: SlideCaptcha) {
    row.consumedAt = new Date();
    await this.captchaRepository.save(row);
  }
}
