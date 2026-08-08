import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Article as ArticleDto, Paginated } from '@hyt/shared';
import { Article as ArticleEntity } from './article.entity';

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
      seoTitle: e.seoTitle,
      seoDescription: e.seoDescription,
      seoKeywords: e.seoKeywords,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    };
  }

  async list(query: QueryArticles): Promise<Paginated<ArticleDto>> {
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
    return { items: items.map((e) => this.toDto(e)), total, page, pageSize };
  }

  async findBySlug(slug: string, onlyPublished = false): Promise<ArticleDto> {
    const where: FindOptionsWhere<ArticleEntity> = { slug };
    if (onlyPublished) where.status = 'published';
    const entity = await this.repo.findOne({ where });
    if (!entity) throw new NotFoundException('文章不存在');
    return this.toDto(entity);
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

  async create(data: Partial<ArticleEntity>): Promise<ArticleDto> {
    await this.assertSlugUnique(data.slug);
    const entity = this.repo.create(data);
    const saved = await this.repo.save(entity);
    return this.toDto(saved);
  }

  async update(id: number, data: Partial<ArticleEntity>): Promise<ArticleDto> {
    await this.assertSlugUnique(data.slug, id);
    const entity = await this.findById(id);
    Object.assign(entity, data);
    const saved = await this.repo.save(entity);
    return this.toDto(saved);
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