import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DashboardStats } from '@hyt/shared';
import { Product } from '../products/product.entity';
import { Article } from '../articles/article.entity';
import { Submission } from '../submissions/submission.entity';
import { AuditLog } from '../audit-log/audit-log.entity';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Product) private readonly products: Repository<Product>,
    @InjectRepository(Article) private readonly articles: Repository<Article>,
    @InjectRepository(Submission) private readonly submissions: Repository<Submission>,
    @InjectRepository(AuditLog) private readonly audit: Repository<AuditLog>,
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
    ] = await Promise.all([
      this.products.count(),
      this.products.count({ where: { status: 'published' } }),
      this.articles.count(),
      this.articles.count({ where: { status: 'published' } }),
      this.submissions.count(),
      this.submissions.count({ where: { status: 'pending' } }),
      this.submissions.find({ order: { id: 'DESC' }, take: 5 }),
      this.audit.find({ order: { createdAt: 'DESC' }, take: 5 }),
    ]);

    return {
      products: { total: productTotal, published: productPublished },
      articles: { total: articleTotal, published: articlePublished },
      submissions: { total: submissionTotal, pending: submissionPending },
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
}
