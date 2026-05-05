import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import { User } from './entities/user.entity';
import { SlideCaptcha } from './entities/slide-captcha.entity';
import { AuthOperationLog } from './entities/auth-operation-log.entity';
import { VisitEvent } from './entities/visit-event.entity';
import { CaptchaService } from './captcha.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { TrackVisitDto } from './dto/track-visit.dto';
import { ReviewUserDto } from './dto/review-user.dto';
import type { Request } from 'express';

type LoginResult = {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

type RegisterResult =
  | LoginResult
  | {
      requiresApproval: true;
      message: string;
    };

@Injectable()
export class AuthService {
  private static readonly adminEmail = '421766153@qq.com';
  private static readonly appStartedAt = new Date();
  private readonly inFlightRequests = new Set<string>();
  private readonly maxLoginAttempts = 5;
  private readonly lockMinutes = 15;
  private readonly ipGeoCache = new Map<string, string>();

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AuthOperationLog)
    private readonly operationLogRepository: Repository<AuthOperationLog>,
    @InjectRepository(VisitEvent)
    private readonly visitEventRepository: Repository<VisitEvent>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly captchaService: CaptchaService,
  ) {}

  async register(payload: RegisterDto): Promise<RegisterResult> {
    const key = `register:${payload.email.toLowerCase()}`;
    this.ensureNoDuplicateRequest(key);

    const captchaRow = await this.captchaService.assertTicketUsable(payload.captchaTicket);

    try {
      const existing = await this.userRepository.findOne({
        where: { email: payload.email.toLowerCase() },
      });
      if (existing) {
        throw new ConflictException('该邮箱已注册');
      }

      const normalizedEmail = payload.email.toLowerCase();
      const isAdmin = normalizedEmail === AuthService.adminEmail;
      const passwordHash = await bcrypt.hash(payload.password, 10);
      const user = this.userRepository.create({
        email: normalizedEmail,
        name: payload.name.trim(),
        passwordHash,
        role: isAdmin ? 'admin' : 'member',
        approvalStatus: isAdmin ? 'approved' : 'pending',
        approvedAt: isAdmin ? new Date() : null,
        approvalNote: isAdmin ? '管理员账号自动通过' : '等待管理员审批',
      });
      const saved = await this.userRepository.save(user);
      await this.visitEventRepository.save(
        this.visitEventRepository.create({
          visitorId: `register:${saved.id}`,
          userId: saved.id,
          eventType: 'REGISTER',
          routePath: '/register',
        }),
      );
      await this.captchaService.consumeTicket(captchaRow);
      if (!isAdmin) {
        await this.appendOperationLog(saved.id, 'REGISTER_PENDING', '用户提交注册申请，等待管理员审批');
        return {
          requiresApproval: true,
          message: '注册申请已提交，请等待管理员审批通过后再登录',
        };
      }
      await this.appendOperationLog(saved.id, 'REGISTER_SUCCESS', '管理员账号注册并自动通过');
      return this.toLoginResult(saved);
    } finally {
      this.inFlightRequests.delete(key);
    }
  }

  async login(payload: LoginDto): Promise<LoginResult> {
    const key = `login:${payload.email.toLowerCase()}`;
    this.ensureNoDuplicateRequest(key);

    let captchaRow: SlideCaptcha | null = null;

    try {
      captchaRow = await this.captchaService.assertTicketUsable(payload.captchaTicket);

      const user = await this.userRepository.findOne({
        where: { email: payload.email.toLowerCase() },
      });

      if (!user) {
        throw new UnauthorizedException('账号或密码错误');
      }

      if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
        throw new HttpException('账号已临时锁定，请稍后再试', HttpStatus.TOO_MANY_REQUESTS);
      }

      const matched = await bcrypt.compare(payload.password, user.passwordHash);
      if (!matched) {
        user.failedAttempts += 1;
        if (user.failedAttempts >= this.maxLoginAttempts) {
          user.lockedUntil = new Date(Date.now() + this.lockMinutes * 60 * 1000);
          user.failedAttempts = 0;
        }
        await this.userRepository.save(user);
        throw new UnauthorizedException('账号或密码错误');
      }

      if (user.email === AuthService.adminEmail && user.role !== 'admin') {
        user.role = 'admin';
        user.approvalStatus = 'approved';
      }

      if (user.approvalStatus !== 'approved') {
        throw new UnauthorizedException(
          user.approvalStatus === 'rejected'
            ? `注册申请未通过${user.approvalNote ? `：${user.approvalNote}` : ''}`
            : '账号待管理员审批通过后才能登录',
        );
      }

      user.failedAttempts = 0;
      user.lockedUntil = null;
      user.loginCount += 1;
      user.lastLoginAt = new Date();
      await this.userRepository.save(user);
      await this.appendOperationLog(user.id, 'LOGIN_SUCCESS', '用户登录成功');
      await this.visitEventRepository.save(
        this.visitEventRepository.create({
          visitorId: `login:${user.id}`,
          userId: user.id,
          eventType: 'LOGIN',
          routePath: '/login',
        }),
      );
      await this.captchaService.consumeTicket(captchaRow);
      return this.toLoginResult(user);
    } finally {
      this.inFlightRequests.delete(key);
    }
  }

  async forgotPassword(payload: ForgotPasswordDto) {
    const user = await this.userRepository.findOne({
      where: { email: payload.email.toLowerCase() },
    });

    if (!user) {
      return { message: '若邮箱存在，重置链接已发送' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await this.userRepository.save(user);

    await this.sendResetEmail(user.email, resetToken);
    return { message: '若邮箱存在，重置链接已发送' };
  }

  async resetPassword(payload: ResetPasswordDto) {
    const user = await this.userRepository.findOne({
      where: { resetToken: payload.token },
    });

    if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('重置令牌无效或已过期');
    }

    user.passwordHash = await bcrypt.hash(payload.newPassword, 10);
    user.resetToken = null;
    user.resetTokenExpiresAt = null;
    user.failedAttempts = 0;
    user.lockedUntil = null;
    await this.userRepository.save(user);

    return { message: '密码重置成功' };
  }

  async profile(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      approvalStatus: user.approvalStatus,
    };
  }

  async dashboard(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const todaysLoginCount = await this.operationLogRepository.count({
      where: {
        action: 'LOGIN_SUCCESS',
        createdAt: Between(startOfToday, endOfToday),
      },
    });

    const [dbProbe] = await this.userRepository.query('SELECT 1 as ok');
    const dbConnected = Boolean(dbProbe?.ok === 1 || dbProbe?.ok === '1');
    const uptimeSeconds = Math.max(
      1,
      Math.floor((Date.now() - AuthService.appStartedAt.getTime()) / 1000),
    );

    const nowTs = Date.now();
    const onlineThreshold = new Date(nowTs - 5 * 60 * 1000);
    const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const last7DaysStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);

    const [totalVisitorsRaw, todayVisitorsRaw, yesterdayVisitorsRaw, onlineVisitorsRaw] = await Promise.all([
      this.visitEventRepository
        .createQueryBuilder('event')
        .select('COUNT(DISTINCT event.visitor_id)', 'count')
        .where('event.event_type IN (:...types)', { types: ['SITE_ENTER', 'ROUTE_VIEW', 'LOGIN', 'REGISTER'] })
        .getRawOne<{ count: string }>(),
      this.visitEventRepository
        .createQueryBuilder('event')
        .select('COUNT(DISTINCT event.visitor_id)', 'count')
        .where('event.created_at >= :start', { start: startOfToday })
        .andWhere('event.created_at < :end', { end: endOfToday })
        .getRawOne<{ count: string }>(),
      this.visitEventRepository
        .createQueryBuilder('event')
        .select('COUNT(DISTINCT event.visitor_id)', 'count')
        .where('event.created_at >= :start', { start: yesterdayStart })
        .andWhere('event.created_at < :end', { end: startOfToday })
        .getRawOne<{ count: string }>(),
      this.visitEventRepository
        .createQueryBuilder('event')
        .select('COUNT(DISTINCT event.visitor_id)', 'count')
        .where('event.created_at >= :threshold', { threshold: onlineThreshold })
        .getRawOne<{ count: string }>(),
    ]);

    const [avgStayRaw] = await this.visitEventRepository.query(
      'SELECT COALESCE(AVG(duration_seconds), 0) AS avg FROM visit_events WHERE duration_seconds > 0',
    );

    const dailyRows = await this.visitEventRepository.query(
      `SELECT to_char(date_trunc('day', created_at), 'MM-DD') AS day, COUNT(*)::int AS value
       FROM visit_events
       WHERE created_at >= $1
       GROUP BY date_trunc('day', created_at)
       ORDER BY date_trunc('day', created_at) ASC`,
      [last7DaysStart],
    );

    const hourRows = await this.visitEventRepository.query(
      `SELECT EXTRACT(HOUR FROM created_at)::int AS hour, COUNT(*)::int AS value
       FROM visit_events
       WHERE created_at >= $1
       GROUP BY EXTRACT(HOUR FROM created_at)
       ORDER BY hour ASC`,
      [startOfToday],
    );

    const regionRows = await this.visitEventRepository.query(
      `SELECT COALESCE(region, '未知') AS name, COUNT(*)::int AS value
       FROM visit_events
       GROUP BY COALESCE(region, '未知')
       ORDER BY value DESC
       LIMIT 6`,
    );

    const deviceRows = await this.visitEventRepository.query(
      `SELECT COALESCE(device_type, 'unknown') AS name, COUNT(*)::int AS value
       FROM visit_events
       GROUP BY COALESCE(device_type, 'unknown')
       ORDER BY value DESC`,
    );

    const browserRows = await this.visitEventRepository.query(
      `SELECT COALESCE(browser_name, 'unknown') AS name, COUNT(*)::int AS value
       FROM visit_events
       GROUP BY COALESCE(browser_name, 'unknown')
       ORDER BY value DESC
       LIMIT 6`,
    );

    const sourceRows = await this.visitEventRepository.query(
      `SELECT COALESCE(source, 'direct') AS name, COUNT(*)::int AS value
       FROM visit_events
       GROUP BY COALESCE(source, 'direct')
       ORDER BY value DESC
       LIMIT 6`,
    );

    const logs = await this.operationLogRepository.find({
      order: { createdAt: 'DESC' },
      take: 18,
    });

    const fullDayLine = this.fillMissingDailyData(dailyRows);
    const hourBar = this.fillMissingHourlyData(hourRows);

    return {
      profile: {
        name: user.name,
        role: user.role,
        lastLoginAt: user.lastLoginAt,
        loginCount: user.loginCount,
        theme: user.themePreference,
      },
      projectStatus: {
        serverStatus: 'online',
        dbStatus: dbConnected ? 'connected' : 'disconnected',
        uptimeSeconds,
        todaysLoginCount,
      },
      bigScreenStats: {
        totalVisitors: Number(totalVisitorsRaw?.count ?? 0),
        todaysVisitors: Number(todayVisitorsRaw?.count ?? 0),
        yesterdaysVisitors: Number(yesterdayVisitorsRaw?.count ?? 0),
        onlineVisitors: Number(onlineVisitorsRaw?.count ?? 0),
        avgStaySeconds: Math.round(Number(avgStayRaw?.avg ?? 0)),
      },
      charts: {
        dailyVisits: fullDayLine,
        hourlyVisits: hourBar,
        regionDistribution: regionRows.map((item: { name: string; value: number }) => ({
          name: item.name,
          value: Number(item.value),
        })),
      },
      behavior: {
        devices: this.toRatio(deviceRows),
        browsers: this.toRatio(browserRows),
        sources: this.toRatio(sourceRows),
      },
      operationLogs: logs.map((item) => ({
        id: item.id,
        action: item.action,
        detail: item.detail,
        createdAt: item.createdAt,
      })),
    };
  }

  async changePassword(userId: string, payload: ChangePasswordDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    const currentMatched = await bcrypt.compare(payload.currentPassword, user.passwordHash);
    if (!currentMatched) {
      throw new BadRequestException('当前密码错误');
    }
    if (payload.currentPassword === payload.newPassword) {
      throw new BadRequestException('新密码不能与当前密码一致');
    }

    user.passwordHash = await bcrypt.hash(payload.newPassword, 10);
    user.failedAttempts = 0;
    user.lockedUntil = null;
    await this.userRepository.save(user);
    await this.appendOperationLog(user.id, 'CHANGE_PASSWORD', '用户修改登录密码');

    return { message: '密码修改成功，请重新登录' };
  }

  async updateTheme(userId: string, theme: 'dark' | 'light') {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }
    user.themePreference = theme;
    await this.userRepository.save(user);
    await this.appendOperationLog(user.id, 'SWITCH_THEME', `切换主题为 ${theme}`);
    return { theme };
  }

  async trackVisit(payload: TrackVisitDto, userId: string | null, req: Request) {
    const ipAddress = this.resolveClientIp(req);
    const region = await this.resolveRegionFromIp(ipAddress);
    const row = this.visitEventRepository.create({
      visitorId: payload.visitorId,
      userId,
      eventType: payload.eventType,
      routePath: payload.routePath ?? null,
      deviceType: payload.deviceType ?? null,
      browserName: payload.browserName ?? null,
      source: payload.source ?? null,
      ipAddress,
      region,
      durationSeconds: payload.durationSeconds ?? 0,
    });
    await this.visitEventRepository.save(row);
    return { ok: true };
  }

  async listUsers(operatorId: string) {
    await this.assertAdmin(operatorId);
    const users = await this.userRepository.find({
      order: { createdAt: 'DESC' },
      take: 100,
    });
    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      approvalStatus: user.approvalStatus,
      approvalNote: user.approvalNote,
      createdAt: user.createdAt,
      approvedAt: user.approvedAt,
    }));
  }

  async reviewUser(operatorId: string, payload: ReviewUserDto) {
    const operator = await this.assertAdmin(operatorId);
    const target = await this.userRepository.findOne({ where: { id: payload.userId } });
    if (!target) {
      throw new BadRequestException('目标用户不存在');
    }
    if (target.email === AuthService.adminEmail) {
      throw new BadRequestException('管理员账号不可审批');
    }

    target.approvalStatus = payload.status;
    target.approvedBy = operator.id;
    target.approvedAt = new Date();
    target.approvalNote = payload.note?.trim() || null;
    await this.userRepository.save(target);

    await this.appendOperationLog(
      operator.id,
      payload.status === 'approved' ? 'APPROVE_USER' : 'REJECT_USER',
      `审批用户 ${target.email} -> ${payload.status}`,
    );
    return { ok: true };
  }

  async deleteUser(operatorId: string, targetUserId: string) {
    const operator = await this.assertAdmin(operatorId);
    if (operator.id === targetUserId) {
      throw new BadRequestException('不能删除当前登录管理员账号');
    }
    const target = await this.userRepository.findOne({ where: { id: targetUserId } });
    if (!target) {
      throw new BadRequestException('目标用户不存在');
    }
    if (target.email === AuthService.adminEmail || target.role === 'admin') {
      throw new BadRequestException('管理员账号不可删除');
    }

    await this.userRepository.delete({ id: targetUserId });
    await this.appendOperationLog(operator.id, 'DELETE_USER', `删除账号 ${target.email}`);
    return { ok: true };
  }

  private ensureNoDuplicateRequest(key: string) {
    if (this.inFlightRequests.has(key)) {
      throw new HttpException('请求处理中，请勿重复提交', HttpStatus.TOO_MANY_REQUESTS);
    }
    this.inFlightRequests.add(key);
  }

  private toLoginResult(user: User): LoginResult {
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      name: user.name,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }

  private async appendOperationLog(userId: string, action: string, detail: string) {
    const row = this.operationLogRepository.create({
      userId,
      action,
      detail,
    });
    await this.operationLogRepository.save(row);
  }

  private fillMissingDailyData(rows: Array<{ day: string; value: number }>) {
    const map = new Map(rows.map((row) => [row.day, Number(row.value)]));
    const result: Array<{ label: string; value: number }> = [];
    for (let i = 6; i >= 0; i -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const label = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      result.push({ label, value: map.get(label) ?? 0 });
    }
    return result;
  }

  private fillMissingHourlyData(rows: Array<{ hour: number; value: number }>) {
    const map = new Map(rows.map((row) => [Number(row.hour), Number(row.value)]));
    const result: Array<{ label: string; value: number }> = [];
    for (let hour = 0; hour < 24; hour += 1) {
      result.push({ label: `${String(hour).padStart(2, '0')}:00`, value: map.get(hour) ?? 0 });
    }
    return result;
  }

  private toRatio(rows: Array<{ name: string; value: number }>) {
    const total = rows.reduce((sum, row) => sum + Number(row.value), 0);
    if (!total) {
      return [];
    }
    return rows.map((row) => ({
      name: row.name,
      value: Number(row.value),
      ratio: Number(((Number(row.value) / total) * 100).toFixed(1)),
    }));
  }

  private async assertAdmin(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }
    if (user.role !== 'admin') {
      throw new UnauthorizedException('仅管理员可操作');
    }
    return user;
  }

  private resolveClientIp(req: Request) {
    const xff = req.headers['x-forwarded-for'];
    const raw = Array.isArray(xff) ? xff[0] : xff;
    const fromForward = raw?.split(',')[0]?.trim();
    const direct = req.ip ?? req.socket?.remoteAddress ?? '';
    return (fromForward || direct || '').replace('::ffff:', '');
  }

  private async resolveRegionFromIp(ip: string) {
    if (!ip) return '未知';
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return '本地网络';
    }
    const cached = this.ipGeoCache.get(ip);
    if (cached) return cached;

    try {
      const response = await fetch(
        `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,regionName,city`,
      );
      if (!response.ok) {
        return '未知';
      }
      const data = (await response.json()) as {
        status?: string;
        country?: string;
        regionName?: string;
        city?: string;
      };
      if (data.status !== 'success') {
        return '未知';
      }
      const region = [data.country, data.regionName, data.city].filter(Boolean).join('-') || '未知';
      this.ipGeoCache.set(ip, region);
      return region;
    } catch {
      return '未知';
    }
  }

  private async sendResetEmail(email: string, token: string) {
    const host = this.configService.get<string>('SMTP_HOST');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    const resetBaseUrl = this.configService.get<string>(
      'RESET_PASSWORD_URL',
      'http://localhost:5173/reset-password',
    );

    if (!host || !user || !pass) {
      // 没有配置SMTP时，方便本地联调。
      // eslint-disable-next-line no-console
      console.log(`[DEV] reset link: ${resetBaseUrl}?token=${token}`);
      return;
    }

    const transporter = nodemailer.createTransport({
      host,
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: false,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: this.configService.get<string>('SMTP_FROM', user),
      to: email,
      subject: '密码找回',
      text: `请在30分钟内访问此链接重置密码：${resetBaseUrl}?token=${token}`,
    });
  }
}
