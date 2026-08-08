import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BackupPayload } from '@hyt/shared';
import { Product } from '../products/product.entity';
import { Article } from '../articles/article.entity';
import { Member } from '../members/member.entity';
import { Topic } from '../topics/topic.entity';
import { SiteConfigService } from '../site-config/site-config.service';

@Injectable()
export class BackupService {
  constructor(
    @InjectRepository(Product) private readonly products: Repository<Product>,
    @InjectRepository(Article) private readonly articles: Repository<Article>,
    @InjectRepository(Member) private readonly members: Repository<Member>,
    @InjectRepository(Topic) private readonly topics: Repository<Topic>,
    private readonly siteConfigService: SiteConfigService,
  ) {}

  /** 导出全站数据为备份包 */
  async export(): Promise<BackupPayload> {
    const [products, articles, members, topics, siteConfig] = await Promise.all([
      this.products.find(),
      this.articles.find(),
      this.members.find(),
      this.topics.find({ relations: ['products'] }),
      this.siteConfigService.getAdminConfig(),
    ]);
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      siteConfig,
      products: products.map((p) => ({ ...p })) as any,
      articles: articles.map((a) => ({ ...a })) as any,
      members: members.map((m) => ({ ...m })) as any,
      topics: topics.map((t) => ({
        id: t.id,
        slug: t.slug,
        name: t.name,
        description: t.description,
        coverUrl: t.coverUrl,
        sortOrder: t.sortOrder,
        productIds: (t.products || []).map((p) => p.id),
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })) as any,
    };
  }

  /**
   * 导入备份：合并模式 —— 已存在 slug 的条目跳过，不存在则新建；
   * 站点配置覆盖更新。不做删除，避免误覆盖现有数据。
   */
  async import(payload: BackupPayload): Promise<{
    products: number;
    articles: number;
    members: number;
    topics: number;
  }> {
    let importedProducts = 0;
    let importedArticles = 0;
    let importedMembers = 0;
    let importedTopics = 0;

    if (payload.siteConfig) {
      const { id, createdAt, updatedAt, content, ...rest } = payload.siteConfig as any;
      await this.siteConfigService.updateConfig(rest);
    }

    if (payload.products?.length) {
      for (const p of payload.products) {
        const exists = await this.products.findOne({ where: { slug: p.slug } });
        if (exists) continue;
        const { id, createdAt, updatedAt, deletedAt, ...rest } = p as any;
        await this.products.save(this.products.create(rest));
        importedProducts += 1;
      }
    }

    if (payload.articles?.length) {
      for (const a of payload.articles) {
        const exists = await this.articles.findOne({ where: { slug: a.slug } });
        if (exists) continue;
        const { id, createdAt, updatedAt, deletedAt, ...rest } = a as any;
        await this.articles.save(this.articles.create(rest));
        importedArticles += 1;
      }
    }

    if (payload.members?.length) {
      for (const m of payload.members) {
        // 成员按 name+role 去重
        const exists = await this.members.findOne({ where: { name: m.name, role: m.role } });
        if (exists) continue;
        const { id, createdAt, updatedAt, deletedAt, ...rest } = m as any;
        await this.members.save(this.members.create(rest));
        importedMembers += 1;
      }
    }

    if (payload.topics?.length) {
      for (const t of payload.topics) {
        const exists = await this.topics.findOne({ where: { slug: t.slug } });
        if (exists) continue;
        const { id, productIds, createdAt, updatedAt, deletedAt, ...rest } = t as any;
        await this.topics.save(this.topics.create(rest));
        importedTopics += 1;
      }
    }

    return {
      products: importedProducts,
      articles: importedArticles,
      members: importedMembers,
      topics: importedTopics,
    };
  }
}
