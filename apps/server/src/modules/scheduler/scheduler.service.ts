import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { Product } from '../products/product.entity';
import { Article } from '../articles/article.entity';

/**
 * 定时发布调度器：每分钟扫描 draft 状态且 scheduledAt <= 当前的产品 / 文章，
 * 自动转为 published（文章同时写入 publishedAt）。
 */
@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @InjectRepository(Product) private readonly products: Repository<Product>,
    @InjectRepository(Article) private readonly articles: Repository<Article>,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async publishScheduled(): Promise<void> {
    const now = new Date().toISOString();
    try {
      // 产品
      const dueProducts = await this.products.find({
        where: { status: 'draft' as any, scheduledAt: LessThanOrEqual(now) as any },
      });
      for (const p of dueProducts) {
        p.status = 'published';
        (p as any).scheduledAt = null;
        await this.products.save(p);
        this.logger.log(`定时发布产品 #${p.id} ${p.slug}`);
      }

      // 文章
      const dueArticles = await this.articles.find({
        where: { status: 'draft' as any, scheduledAt: LessThanOrEqual(now) as any },
      });
      for (const a of dueArticles) {
        a.status = 'published';
        a.publishedAt = a.publishedAt || new Date().toISOString();
        (a as any).scheduledAt = null;
        await this.articles.save(a);
        this.logger.log(`定时发布文章 #${a.id} ${a.slug}`);
      }
    } catch (e) {
      this.logger.error(`定时发布扫描失败: ${(e as Error).message}`);
    }
  }
}
