import { Injectable, Logger } from '@nestjs/common';
import { SiteConfigService } from '../site-config/site-config.service';
import { isSafeOutboundUrl } from '../../common/utils/ssrf';

export interface WebhookEvent {
  /** 事件类型：product.published / article.published / submission.created / subscriber.confirmed 等 */
  event: string;
  /** 时间戳 */
  timestamp: string;
  /** 数据负载（已脱敏） */
  data: Record<string, any>;
}

/**
 * Webhook 推送服务：在关键事件发生时，向站点配置中的 webhookUrls 异步发送 POST 请求。
 * 单条失败不阻断业务；超时 5s。
 */
@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(private readonly siteConfig: SiteConfigService) {}

  /**
   * 触发一次 webhook 推送（不抛错，仅记录日志）。
   * 调用方无需 await，但 await 也不阻塞太久（每个 URL 5s 超时）。
   */
  async emit(event: string, data: Record<string, any>): Promise<void> {
    try {
      const cfg = await this.siteConfig.getAdminConfig();
      const raw = (cfg.webhookUrls || '').trim();
      if (!raw) return;
      const urls = raw
        .split(/[\s,]+/)
        .map((u: string) => u.trim())
        .filter((u: string) => /^https?:\/\//.test(u));
      if (!urls.length) return;

      // SSRF 防护：过滤掉指向内网 / 本地的地址
      const safeUrls: string[] = [];
      for (const u of urls) {
        if (await isSafeOutboundUrl(u)) {
          safeUrls.push(u);
        } else {
          this.logger.warn(`Webhook ${u} 已跳过：目标地址不安全（可能为内网/本地地址）`);
        }
      }
      if (!safeUrls.length) return;

      const payload: WebhookEvent = {
        event,
        timestamp: new Date().toISOString(),
        data,
      };

      // 并发推送，单条失败不影响其他
      await Promise.allSettled(
        safeUrls.map(async (url: string) => {
          try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 5000);
            const res = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
              signal: controller.signal,
            });
            clearTimeout(timer);
            if (!res.ok) {
              this.logger.warn(`Webhook ${url} 返回 ${res.status}`);
            }
          } catch (e) {
            this.logger.warn(`Webhook ${url} 推送失败: ${(e as Error).message}`);
          }
        }),
      );
    } catch (e) {
      this.logger.warn(`Webhook emit(${event}) 异常: ${(e as Error).message}`);
    }
  }
}
