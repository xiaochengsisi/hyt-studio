import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Article as ArticleDto, Paginated } from '@hyt/shared';
import { CacheService } from '../../common/cache.service';
import { Article as ArticleEntity } from './article.entity';
import { RevisionsService } from '../revisions/revisions.service';
import { WebhookService } from '../webhook/webhook.service';
import { TranslationsService } from '../translations/translations.service';

export interface QueryArticles {
  page?: number;
  pageSize?: number;
  status?: string;
  keyword?: string;
}

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(ArticleEntity)
    private readonly repo: Repository<ArticleEntity>,
    private readonly cache: CacheService,
    private readonly revisions: RevisionsService,
    private readonly webhook: WebhookService,
    private readonly translations: TranslationsService,
  ) {}

  private toDto(e: ArticleEntity): ArticleDto {
    return {
      id: e.id,
      slug: e.slug,
      title: e.title,
      summary: e.summary,
      content: e.content,
      coverUrl: e.coverUrl,
      tags: e.tags,
      status: e.status,
      publishedAt: e.publishedAt,
      scheduledAt: e.scheduledAt,
      seoTitle: e.seoTitle,
      seoDescription: e.seoDescription,
      seoKeywords: e.seoKeywords,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    };
  }

  async list(query: QueryArticles): Promise<Paginated<ArticleDto>> {
    // 前台公开列表（status=published）加 TTL 缓存；后台列表不缓存
    const cacheable = query.status === 'published';
    const cacheKey = `article:list:${JSON.stringify(query)}`;
    if (cacheable) {
      const hit = this.cache.get<Paginated<ArticleDto>>(cacheKey);
      if (hit) return hit;
    }
    const page = query.page || 1;
    const pageSize = query.pageSize || 100;
    const qb = this.repo.createQueryBuilder('a');
    if (query.status) qb.andWhere('a.status = :status', { status: query.status });
    if (query.keyword) {
      const kw = `%${query.keyword}%`;
      qb.andWhere(
        '(a.title LIKE :kw OR a.slug LIKE :kw OR a.summary LIKE :kw OR a.tags LIKE :kw)',
        { kw },
      );
    }
    qb.orderBy('a.publishedAt', 'DESC')
      .addOrderBy('a.id', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);
    const [items, total] = await qb.getManyAndCount();
    const result: Paginated<ArticleDto> = {
      items: items.map((e) => this.toDto(e)),
      total,
      page,
      pageSize,
    };
    if (cacheable) this.cache.set(cacheKey, result, 20_000);
    return result;
  }

  async findBySlug(slug: string, onlyPublished = false, lang?: string): Promise<ArticleDto> {
    const where: FindOptionsWhere<ArticleEntity> = { slug };
    if (onlyPublished) where.status = 'published';
    const entity = await this.repo.findOne({ where });
    if (!entity) throw new NotFoundException('文章不存在');
    const dto = this.toDto(entity);
    // 多语言：若指定 lang 且存在翻译，覆盖对应字段
    if (lang) {
      const t = await this.translations.get('article', entity.id, lang);
      if (t && Object.keys(t).length) {
        for (const k of ['title', 'summary', 'content']) {
          if (typeof t[k] === 'string' && t[k]!.length) {
            (dto as any)[k] = t[k];
          }
        }
      }
    }
    return dto;
  }

  async findById(id: number): Promise<ArticleEntity> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('文章不存在');
    return entity;
  }

  private async assertSlugUnique(slug: string | undefined, excludeId?: number): Promise<void> {
    if (!slug) return;
    const qb = this.repo.createQueryBuilder('a').where('a.slug = :slug', { slug });
    if (excludeId) qb.andWhere('a.id != :excludeId', { excludeId });
    const found = await qb.getOne();
    if (found) throw new ConflictException(`slug「${slug}」已被占用`);
  }

  async create(data: Partial<ArticleEntity>, username?: string): Promise<ArticleDto> {
    await this.assertSlugUnique(data.slug);
    const entity = this.repo.create(data);
    const saved = await this.repo.save(entity);
    const dto = this.toDto(saved);
    await this.revisions.saveSnapshot('article', saved.id, dto, username);
    if (saved.status === 'published') {
      void this.webhook.emit('article.published', { id: saved.id, slug: saved.slug, title: saved.title });
    } else {
      void this.webhook.emit('article.created', { id: saved.id, slug: saved.slug, title: saved.title, status: saved.status });
    }
    return dto;
  }

  async update(id: number, data: Partial<ArticleEntity>, username?: string): Promise<ArticleDto> {
    await this.assertSlugUnique(data.slug, id);
    const entity = await this.findById(id);
    const wasDraft = entity.status !== 'published';
    Object.assign(entity, data);
    const saved = await this.repo.save(entity);
    const dto = this.toDto(saved);
    await this.revisions.saveSnapshot('article', saved.id, dto, username);
    if (wasDraft && saved.status === 'published') {
      void this.webhook.emit('article.published', { id: saved.id, slug: saved.slug, title: saved.title });
    } else {
      void this.webhook.emit('article.updated', { id: saved.id, slug: saved.slug, title: saved.title });
    }
    return dto;
  }

  async remove(id: number): Promise<void> {
    // 软删除：标记 deletedAt，数据仍保留可恢复
    await this.repo.softDelete(id);
  }

  /** 批量操作：发布 / 草稿 / 删除（软删除）。文章无归档状态。 */
  async bulk(ids: number[], action: 'publish' | 'draft' | 'archive' | 'delete'): Promise<number> {
    if (!ids?.length) return 0;
    if (action === 'archive') {
      throw new BadRequestException('文章不支持归档操作');
    }
    if (action === 'delete') {
      const res = await this.repo.softDelete(ids);
      return res.affected || 0;
    }
    const status = action === 'publish' ? 'published' : 'draft';
    const res = await this.repo.update(ids, { status });
    return res.affected || 0;
  }
}