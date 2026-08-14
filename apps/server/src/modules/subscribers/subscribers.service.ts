import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { Subscriber as SubscriberDto } from '@hyt/shared';
import { Subscriber } from './subscriber.entity';
import { MailerService } from '../mail/mailer.service';
import { SiteConfigService } from '../site-config/site-config.service';
import { WebhookService } from '../webhook/webhook.service';

@Injectable()
export class SubscribersService {
  constructor(
    @InjectRepository(Subscriber) private readonly repo: Repository<Subscriber>,
    private readonly mailer: MailerService,
    private readonly siteConfig: SiteConfigService,
    private readonly webhook: WebhookService,
  ) {}

  private toDto(e: Subscriber): SubscriberDto {
    return { id: e.id, email: e.email, confirmed: e.confirmed, createdAt: e.createdAt };
  }

  /** 生成确认 token 及 24h 过期时间 */
  private freshToken(): { token: string; expiredAt: string } {
    return {
      token: randomBytes(16).toString('hex'),
      expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  /** 订阅：创建未确认记录并发送确认邮件 */
  async subscribe(email: string): Promise<{ pending: boolean }> {
    const normalized = (email || '').trim().toLowerCase();
    if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new BadRequestException('邮箱格式不正确');
    }
    const existing = await this.repo.findOne({ where: { email: normalized } });
    if (existing) {
      if (existing.confirmed) return { pending: false };
      // 已存在未确认 → 刷新 token 并重发确认邮件
      const { token, expiredAt } = this.freshToken();
      existing.confirmToken = token;
      existing.confirmTokenExpiredAt = expiredAt;
      const refreshed = await this.repo.save(existing);
      await this.sendConfirm(refreshed);
      return { pending: true };
    }
    const { token, expiredAt } = this.freshToken();
    const entity = this.repo.create({
      email: normalized,
      confirmed: false,
      confirmToken: token,
      confirmTokenExpiredAt: expiredAt,
    });
    const saved = await this.repo.save(entity);
    await this.sendConfirm(saved);
    return { pending: true };
  }

  /** 确认订阅（点击邮件链接） */
  async confirm(token: string): Promise<SubscriberDto> {
    const entity = await this.repo.findOne({ where: { confirmToken: token } });
    if (!entity) throw new NotFoundException('确认链接无效或已过期');
    // 检查 token 是否已超过 24h 有效期
    if (entity.confirmTokenExpiredAt && new Date(entity.confirmTokenExpiredAt) < new Date()) {
      throw new BadRequestException('确认链接已过期，请重新订阅以获取新链接');
    }
    entity.confirmed = true;
    entity.confirmToken = null as any;
    entity.confirmTokenExpiredAt = null as any;
    const saved = await this.repo.save(entity);
    void this.webhook.emit('subscriber.confirmed', { id: saved.id, email: saved.email });
    return this.toDto(saved);
  }

  /** 退订 */
  async unsubscribe(email: string): Promise<void> {
    const entity = await this.repo.findOne({
      where: { email: (email || '').trim().toLowerCase() },
    });
    if (entity) await this.repo.remove(entity);
  }

  async listAll(): Promise<SubscriberDto[]> {
    const items = await this.repo.find({ order: { id: 'DESC' } });
    return items.map((e) => this.toDto(e));
  }

  /** 群发邮件给所有已确认订阅者（分批并发，每批 8 封，单条失败不阻断） */
  async broadcast(subject: string, html: string): Promise<{ sent: number }> {
    const items = await this.repo.find({ where: { confirmed: true } });
    const BATCH = 8;
    let sent = 0;
    for (let i = 0; i < items.length; i += BATCH) {
      const batch = items.slice(i, i + BATCH);
      const results = await Promise.allSettled(
        batch.map((s) => this.mailer.send({ to: s.email, subject, html })),
      );
      sent += results.filter((r) => r.status === 'fulfilled').length;
    }
    return { sent };
  }

  private async sendConfirm(s: Subscriber): Promise<void> {
    const cfg = await this.siteConfig.getAdminConfig();
    const base = (cfg.siteUrl || process.env.PUBLIC_BASE_URL || '').replace(/\/+$/, '');
    const siteName = cfg.siteName || 'HYT Studio';
    const link = `${base}/api/subscribers/confirm?token=${s.confirmToken}`;
    const html = `
      <div style="font-family: sans-serif; max-width: 520px; margin: auto;">
        <h2 style="color:#0a7d50;">确认订阅 ${siteName}</h2>
        <p>你正在订阅 <strong>${siteName}</strong> 的更新邮件（新项目 / 新版本 / 新文章）。</p>
        <p>请点击下方按钮确认订阅（若非本人操作请忽略此邮件）：</p>
        <p><a href="${link}" style="display:inline-block;padding:10px 20px;background:#0a7d50;color:#fff;text-decoration:none;border-radius:4px;">确认订阅</a></p>
        <p style="color:#999;font-size:12px;">或复制链接到浏览器：${link}</p>
      </div>`;
    await this.mailer.send({
      to: s.email,
      subject: `确认订阅 ${siteName}`,
      html,
      text: `确认订阅：${link}`,
    });
  }
}
