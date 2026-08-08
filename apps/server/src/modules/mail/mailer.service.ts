import { Injectable, Logger } from '@nestjs/common';
import { SiteConfigService } from '../site-config/site-config.service';

/**
 * 邮件发送服务：基于 nodemailer，SMTP 配置来自后台站点设置（smtpHost/...）。
 * 未配置 SMTP 时降级为「控制台打印」，保证开发环境与未配置场景不报错。
 */
@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  constructor(private readonly siteConfig: SiteConfigService) {}

  /** 是否已配置可用 SMTP */
  async isConfigured(): Promise<boolean> {
    const cfg = await this.siteConfig.getAdminConfig();
    return !!(cfg.smtpHost && cfg.smtpUser && cfg.smtpFrom);
  }

  async send(opts: { to: string; subject: string; html: string; text?: string }): Promise<void> {
    const cfg = await this.siteConfig.getAdminConfig();
    if (!cfg.smtpHost || !cfg.smtpFrom) {
      // 未配置：降级打印，便于本地开发观察
      this.logger.log(`[MAIL 未配置 SMTP，降级打印] → ${opts.to}\n主题: ${opts.subject}\n${opts.text || ''}`);
      return;
    }
    // 动态加载 nodemailer，避免未启用时强依赖初始化
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: cfg.smtpHost,
      port: cfg.smtpPort || 465,
      secure: cfg.smtpSecure ?? (cfg.smtpPort || 465) === 465,
      auth: cfg.smtpUser ? { user: cfg.smtpUser, pass: cfg.smtpPass || '' } : undefined,
    });
    await transporter.sendMail({
      from: cfg.smtpFrom,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });
  }
}
