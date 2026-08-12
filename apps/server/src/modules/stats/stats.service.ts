import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityItem, DashboardStats, SiteStats } from '@hyt/shared';
import { CacheService } from '../../common/cache.service';
import { Product } from '../products/product.entity';
import { Article } from '../articles/article.entity';
import { Submission } from '../submissions/submission.entity';
import { AuditLog } from '../audit-log/audit-log.entity';
import { Member } from '../members/member.entity';
import { Topic } from '../topics/topic.entity';
import { Subscriber } from '../subscribers/subscriber.entity';
import { Media } from '../media/media.entity';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Product) private readonly products: Repository<Product>,
    @InjectRepository(Article) private readonly articles: Repository<Article>,
    @InjectRepository(Submission) private readonly submissions: Repository<Submission>,
    @InjectRepository(AuditLog) private readonly audit: Repository<AuditLog>,
    @InjectRepository(Member) private readonly members: Repository<Member>,
    @InjectRepository(Topic) private readonly topics: Repository<Topic>,
    @InjectRepository(Subscriber) private readonly subscribers: Repository<Subscriber>,
    @InjectRepository(Media) private readonly media: Repository<Media>,
    private readonly cache: CacheService,
  ) {}

  async getDashboardStats(): Promise<DashboardStats> {
    const [
      productTotal,
      productPublished,
      articleTotal,
      articlePublished,
      submissionTotal,
      submissionPending,
      recentSubmissions,
      recentAudit,
      viewsAgg,
      likesAgg,
      starsAgg,
      memberCount,
      topicCount,
      subscriberCount,
      mediaCount,
      topProducts,
    ] = await Promise.all([
      this.products.count(),
      this.products.count({ where: { status: 'published' } }),
      this.articles.count(),
      this.articles.count({ where: { status: 'published' } }),
      this.submissions.count(),
      this.submissions.count({ where: { status: 'pending' } }),
      this.submissions.find({ order: { id: 'DESC' }, take: 5 }),
      this.audit.find({ order: { createdAt: 'DESC' }, take: 5 }),
      this.products
        .createQueryBuilder('p')
        .select('COALESCE(SUM(p.viewCount),0)', 'sum')
        .getRawOne<{ sum: string }>(),
      this.products
        .createQueryBuilder('p')
        .select('COALESCE(SUM(p.likeCount),0)', 'sum')
        .getRawOne<{ sum: string }>(),
      this.products
        .createQueryBuilder('p')
        .select('COALESCE(SUM(p.githubStars),0)', 'sum')
        .getRawOne<{ sum: string }>(),
      this.members.count(),
      this.topics.count(),
      this.subscribers.count(),
      this.media.count(),
      this.products.find({
        where: { status: 'published' as any },
        order: { viewCount: 'DESC' },
        take: 5,
        select: ['id', 'slug', 'name', 'viewCount', 'likeCount', 'githubStars'],
      }),
    ]);

    return {
      products: { total: productTotal, published: productPublished },
      articles: { total: articleTotal, published: articlePublished },
      submissions: { total: submissionTotal, pending: submissionPending },
      engagement: {
        totalViews: Number(viewsAgg?.sum || 0),
        totalLikes: Number(likesAgg?.sum || 0),
        totalStars: Number(starsAgg?.sum || 0),
      },
      counts: {
        members: memberCount,
        topics: topicCount,
        subscribers: subscriberCount,
        media: mediaCount,
      },
      topProducts: topProducts.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        viewCount: p.viewCount,
        likeCount: p.likeCount,
        githubStars: p.githubStars,
      })),
      recentSubmissions: recentSubmissions.map((s) => ({
        id: s.id,
        name: s.name,
        tagline: s.tagline,
        description: s.description,
        repoUrl: s.repoUrl,
        homepage: s.homepage,
        author: s.author,
        email: s.email,
        status: s.status,
        reviewNote: s.reviewNote,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
      recentAudit: recentAudit.map((a) => ({
        id: a.id,
        action: a.action,
        method: a.method,
        path: a.path,
        target: a.target,
        targetId: a.targetId,
        userId: a.userId,
        username: a.username,
        ip: a.ip,
        detail: a.detail,
        status: a.status,
        createdAt: a.createdAt,
      })),
    };
  }

  /** 前台公开聚合统计：已发布产品/文章数 + Star/浏览/点赞汇总 + 成员数 */
  async getPublicStats(): Promise<SiteStats> {
    const cacheKey = 'stats:public';
    const hit = this.cache.get<SiteStats>(cacheKey);
    if (hit) return hit;
    const [products, articles, totalStars, totalViews, totalLikes, members] = await Promise.all([
      this.products.count({ where: { status: 'published' } }),
      this.articles.count({ where: { status: 'published' } }),
      this.products
        .createQueryBuilder('p')
        .select('COALESCE(SUM(p.githubStars),0)', 'sum')
        .where('p.status = :s', { s: 'published' })
        .getRawOne<{ sum: string }>(),
      this.products
        .createQueryBuilder('p')
        .select('COALESCE(SUM(p.viewCount),0)', 'sum')
        .where('p.status = :s', { s: 'published' })
        .getRawOne<{ sum: string }>(),
      this.products
        .createQueryBuilder('p')
        .select('COALESCE(SUM(p.likeCount),0)', 'sum')
        .where('p.status = :s', { s: 'published' })
        .getRawOne<{ sum: string }>(),
      this.members.count(),
    ]);
    const result: SiteStats = {
      products,
      articles,
      totalStars: Number(totalStars?.sum || 0),
      totalViews: Number(totalViews?.sum || 0),
      totalLikes: Number(totalLikes?.sum || 0),
      members,
    };
    this.cache.set(cacheKey, result, 60_000);
    return result;
  }

  /**
   * 首页活动流：聚合最近的产品上架、文章发布、版本发布（按 githubSyncedAt 近期变更且 version 存在）。
   * 取最近 limit 条，按时间倒序。
   */
  async getActivity(limit = 8): Promise<ActivityItem[]> {
    const take = Math.min(Math.max(limit || 8, 1), 20);
    const cacheKey = `stats:activity:${take}`;
    const hit = this.cache.get<ActivityItem[]>(cacheKey);
    if (hit) return hit;
    const [recentProducts, recentArticles] = await Promise.all([
      this.products.find({
        where: { status: 'published' as any },
        order: { id: 'DESC' },
        take,
        select: ['id', 'slug', 'name', 'tagline', 'createdAt', 'version', 'githubSyncedAt', 'language'],
      }),
      this.articles.find({
        where: { status: 'published' as any },
        order: { id: 'DESC' },
        take,
        select: ['id', 'slug', 'title', 'summary', 'publishedAt', 'createdAt'],
      }),
    ]);

    const items: ActivityItem[] = [];

    for (const p of recentProducts) {
      const time = p.githubSyncedAt && p.version ? p.githubSyncedAt : p.createdAt;
      items.push({
        type: p.githubSyncedAt && p.version ? 'release' : 'product',
        title: p.name,
        slug: p.slug,
        description: p.tagline,
        time,
        meta: p.githubSyncedAt && p.version ? `v${p.version}` : p.language || undefined,
      });
    }

    for (const a of recentArticles) {
      items.push({
        type: 'article',
        title: a.title,
        slug: a.slug,
        description: a.summary,
        time: a.publishedAt || a.createdAt,
      });
    }

    const result = items
      .sort((x, y) => new Date(y.time).getTime() - new Date(x.time).getTime())
      .slice(0, take);
    this.cache.set(cacheKey, result, 30_000);
    return result;
  }
}
