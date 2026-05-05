import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('slide_captchas')
export class SlideCaptcha {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 目标：滑块中心点相对轨道内容区左缘的像素位置 */
  @Column({ type: 'int', name: 'target_x_px' })
  targetXPx: number;

  @Column({ type: 'int', name: 'track_inner_width_px', default: 280 })
  trackInnerWidthPx: number;

  @Column({ type: 'int', name: 'knob_radius_px', default: 22 })
  knobRadiusPx: number;

  @Column({ type: 'int', name: 'tolerance_px', default: 12 })
  tolerancePx: number;

  @Column({ type: 'timestamptz', name: 'expires_at' })
  expiresAt: Date;

  /** 校验通过后签发的一次性票据（提交登录/注册时携带） */
  @Column({ type: 'varchar', length: 64, nullable: true, name: 'verify_ticket', unique: true })
  verifyTicket: string | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'consumed_at' })
  consumedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
