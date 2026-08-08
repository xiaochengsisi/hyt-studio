import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Paginated, Product } from '@hyt/shared';
import { Product as ProductEntity } from './product.entity';

export interface QueryProducts {
  page?: number;
  pageSize?: number;
  status?: string;
  featured?: boolean;
  keyword?: string;
  tag?: string;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly repo: Repository<ProductEntity>,
  ) {}

  private toDto(e: ProductEntity): Product {
    return {
      id: e.id,
      slug: e.slug,
      name: e.name,
      tagline: e.tagline,
      description: e.description,
      content: e.content,
      logoUrl: e.logoUrl,
      screenshots: e.screenshots,
      tags: e.tags,
      repoUrl: e.repoUrl,
      homepage: e.homepage,
      docsUrl: e.docsUrl,
      version: e.version,
      status: e.status,
      featured: e.featured,
      sortOrder: e.sortOrder,
      seoTitle: e.seoTitle,
      seoDescription: e.seoDescription,
      seoKeywords: e.seoKeywords,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    };
  }

  async list(query: QueryProducts): Promise<Paginated<Product>> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 100;
    const qb = this.repo.createQueryBuilder('p');
    if (query.status) qb.andWhere('p.status = :status', { status: query.status });
    if (query.featured !== undefined)
      qb.andWhere('p.featured = :featured', { featured: query.featured });
    if (query.keyword) {
      const kw = `%${query.keyword}%`;
      qb.andWhere(
        '(p.name LIKE :kw OR p.slug LIKE :kw OR p.tagline LIKE :kw OR p.description LIKE :kw OR p.tags LIKE :kw)',
        { kw },
      );
    }
    if (query.tag) {
      // 精确匹配逗号分隔标签中的某一项：用首尾加逗号的方式避免子串误匹配
      qb.andWhere("(',' || p.tags || ',') LIKE :tag", { tag: `%,${query.tag},%` });
    }
    qb.orderBy('p.sortOrder', 'ASC')
      .addOrderBy('p.id', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);
    const [items, total] = await qb.getManyAndCount();
    return {
      items: items.map((e) => this.toDto(e)),
      total,
      page,
      pageSize,
    };
  }

  async findBySlug(slug: string, onlyPublished = false): Promise<Product> {
    const where: FindOptionsWhere<ProductEntity> = { slug };
    if (onlyPublished) where.status = 'published';
    const entity = await this.repo.findOne({ where });
    if (!entity) throw new NotFoundException('产品不存在');
    return this.toDto(entity);
  }

  async findById(id: number): Promise<ProductEntity> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('产品不存在');
    return entity;
  }

  private async assertSlugUnique(slug: string | undefined, excludeId?: number): Promise<void> {
    if (!slug) return;
    const qb = this.repo.createQueryBuilder('p').where('p.slug = :slug', { slug });
    if (excludeId) qb.andWhere('p.id != :excludeId', { excludeId });
    const found = await qb.getOne();
    if (found) throw new ConflictException(`slug「${slug}」已被占用`);
  }

  async create(data: Partial<ProductEntity>): Promise<Product> {
    await this.assertSlugUnique(data.slug);
    const entity = this.repo.create(data);
    const saved = await this.repo.save(entity);
    return this.toDto(saved);
  }

  async update(id: number, data: Partial<ProductEntity>): Promise<Product> {
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

  /** 已发布产品的全部标签（去重，按出现频次降序），供前台标签筛选 */
  async listTags(): Promise<{ name: string; count: number }[]> {
    const rows = await this.repo.find({
      where: { status: 'published' },
      select: ['tags'],
    });
    const counter = new Map<string, number>();
    for (const r of rows) {
      for (const t of (r.tags || '').split(',').map((s) => s.trim()).filter(Boolean)) {
        counter.set(t, (counter.get(t) || 0) + 1);
      }
    }
    return [...counter.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }

  /** 相关项目：按标签重合度排序，排除自身，仅已发布 */
  async findRelated(slug: string, limit = 4): Promise<Product[]> {
    const current = await this.repo.findOne({ where: { slug } });
    if (!current) return [];
    const tags = (current.tags || '').split(',').map((s) => s.trim()).filter(Boolean);
    if (!tags.length) return [];
    // 取一批已发布产品（排除自身）后在内存中按标签重合度排序
    const candidates = await this.repo
      .createQueryBuilder('p')
      .where('p.status = :status', { status: 'published' })
      .andWhere('p.id != :id', { id: current.id })
      .take(50)
      .getMany();
    return candidates
      .map((c) => {
        const ct = (c.tags || '').split(',').map((s) => s.trim()).filter(Boolean);
        const overlap = ct.filter((t) => tags.includes(t)).length;
        return { c, overlap };
      })
      .filter((x) => x.overlap > 0)
      .sort((a, b) => b.overlap - a.overlap)
      .slice(0, limit)
      .map((x) => this.toDto(x.c));
  }

  /** 批量操作：发布 / 草稿 / 归档 / 删除（软删除） */
  async bulk(ids: number[], action: 'publish' | 'draft' | 'archive' | 'delete'): Promise<number> {
    if (!ids?.length) return 0;
    if (action === 'delete') {
      const res = await this.repo.softDelete(ids);
      return res.affected || 0;
    }
    const status = action === 'publish' ? 'published' : action === 'draft' ? 'draft' : 'archived';
    const res = await this.repo.update(ids, { status });
    return res.affected || 0;
  }
}