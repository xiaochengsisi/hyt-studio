import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Paginated, Product } from '@hyt/shared';
import { Product as ProductEntity } from './product.entity';
import { ProductLike } from './product-like.entity';
import { RevisionsService } from '../revisions/revisions.service';
import { WebhookService } from '../webhook/webhook.service';

export interface QueryProducts {
  page?: number;
  pageSize?: number;
  status?: string;
  featured?: boolean;
  keyword?: string;
  tag?: string;
  language?: string;
  category?: string;
  sort?: 'default' | 'hot' | 'views' | 'likes' | 'stars' | 'newest';
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly repo: Repository<ProductEntity>,
    @InjectRepository(ProductLike)
    private readonly likesRepo: Repository<ProductLike>,
    private readonly revisions: RevisionsService,
    private readonly webhook: WebhookService,
  ) {}

  /** 简单内存去重：同 IP + 同产品 10 分钟内只计一次浏览 */
  private readonly viewDedup = new Map<string, number>();
  private viewDedupTtl = 10 * 60 * 1000;

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
      scheduledAt: e.scheduledAt,
      viewCount: e.viewCount,
      likeCount: e.likeCount,
      language: e.language,
      category: e.category,
      githubStars: e.githubStars,
      githubForks: e.githubForks,
      githubOpenIssues: e.githubOpenIssues,
      githubLicense: e.githubLicense,
      githubUpdatedAt: e.githubUpdatedAt,
      githubSyncedAt: e.githubSyncedAt,
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
    if (query.language) qb.andWhere('p.language = :language', { language: query.language });
    if (query.category) qb.andWhere('p.category = :category', { category: query.category });

    // 排序：默认按 sortOrder；hot = 浏览+点赞加权；其余按对应字段
    switch (query.sort) {
      case 'views':
        qb.orderBy('p.viewCount', 'DESC').addOrderBy('p.id', 'DESC');
        break;
      case 'likes':
        qb.orderBy('p.likeCount', 'DESC').addOrderBy('p.id', 'DESC');
        break;
      case 'stars':
        qb.orderBy('p.githubStars', 'DESC').addOrderBy('p.id', 'DESC');
        break;
      case 'newest':
        qb.orderBy('p.id', 'DESC');
        break;
      case 'hot':
        qb.orderBy('p.viewCount + p.likeCount * 5 + p.githubStars', 'DESC').addOrderBy('p.id', 'DESC');
        break;
      default:
        qb.orderBy('p.sortOrder', 'ASC').addOrderBy('p.id', 'DESC');
    }
    qb.skip((page - 1) * pageSize).take(pageSize);
    const [items, total] = await qb.getManyAndCount();
    return {
      items: items.map((e) => this.toDto(e)),
      total,
      page,
      pageSize,
    };
  }

  async findBySlug(slug: string, onlyPublished = false, ip?: string): Promise<Product> {
    const where: FindOptionsWhere<ProductEntity> = { slug };
    if (onlyPublished) where.status = 'published';
    const entity = await this.repo.findOne({ where });
    if (!entity) throw new NotFoundException('产品不存在');
    // 浏览量计数：同 IP 10 分钟内去重
    if (onlyPublished && ip) {
      const key = `${ip}:${entity.id}`;
      const now = Date.now();
      const last = this.viewDedup.get(key) || 0;
      if (now - last > this.viewDedupTtl) {
        this.viewDedup.set(key, now);
        await this.repo.increment({ id: entity.id }, 'viewCount', 1);
        entity.viewCount += 1;
      }
    }
    return this.toDto(entity);
  }

  /** 匿名点赞：按 anonId 去重，已点过则取消点赞 */
  async toggleLike(slug: string, anonId: string): Promise<{ liked: boolean; likeCount: number }> {
    const product = await this.repo.findOne({ where: { slug, status: 'published' as any } });
    if (!product) throw new NotFoundException('产品不存在');
    const existing = await this.likesRepo.findOne({ where: { productId: product.id, anonId } });
    if (existing) {
      await this.likesRepo.remove(existing);
      product.likeCount = Math.max(0, product.likeCount - 1);
      await this.repo.save(product);
      return { liked: false, likeCount: product.likeCount };
    }
    await this.likesRepo.save(this.likesRepo.create({ productId: product.id, anonId }));
    product.likeCount += 1;
    await this.repo.save(product);
    return { liked: true, likeCount: product.likeCount };
  }

  /** 热门产品（综合浏览+点赞+star） */
  async findHot(limit = 6): Promise<Product[]> {
    const items = await this.repo
      .createQueryBuilder('p')
      .where('p.status = :status', { status: 'published' })
      .orderBy('p.viewCount + p.likeCount * 5 + p.githubStars', 'DESC')
      .addOrderBy('p.id', 'DESC')
      .take(limit)
      .getMany();
    return items.map((e) => this.toDto(e));
  }

  /** 已发布产品的编程语言列表（用于筛选） */
  async listLanguages(): Promise<{ name: string; count: number }[]> {
    const rows = await this.repo.find({
      where: { status: 'published' as any },
      select: ['language'],
    });
    const counter = new Map<string, number>();
    for (const r of rows) {
      const lang = (r.language || '').trim();
      if (lang) counter.set(lang, (counter.get(lang) || 0) + 1);
    }
    return [...counter.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
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

  async create(data: Partial<ProductEntity>, username?: string): Promise<Product> {
    await this.assertSlugUnique(data.slug);
    const entity = this.repo.create(data);
    const saved = await this.repo.save(entity);
    const dto = this.toDto(saved);
    await this.revisions.saveSnapshot('product', saved.id, dto, username);
    if (saved.status === 'published') {
      void this.webhook.emit('product.published', { id: saved.id, slug: saved.slug, name: saved.name });
    } else {
      void this.webhook.emit('product.created', { id: saved.id, slug: saved.slug, name: saved.name, status: saved.status });
    }
    return dto;
  }

  async update(id: number, data: Partial<ProductEntity>, username?: string): Promise<Product> {
    await this.assertSlugUnique(data.slug, id);
    const entity = await this.findById(id);
    const wasDraft = entity.status !== 'published';
    Object.assign(entity, data);
    const saved = await this.repo.save(entity);
    const dto = this.toDto(saved);
    await this.revisions.saveSnapshot('product', saved.id, dto, username);
    // 草稿 → 已发布 触发 published 事件
    if (wasDraft && saved.status === 'published') {
      void this.webhook.emit('product.published', { id: saved.id, slug: saved.slug, name: saved.name });
    } else {
      void this.webhook.emit('product.updated', { id: saved.id, slug: saved.slug, name: saved.name });
    }
    return dto;
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

  /** 从 GitHub 仓库 URL 解析 owner/repo */
  private parseRepoUrl(url: string): { owner: string; repo: string } {
    // 匹配 https://github.com/owner/repo(.git)? 或 git@github.com:owner/repo(.git)?
    const m = url.match(/github\.com[:/]([^/]+)\/([^/.\s]+)(?:\.git)?/i);
    if (!m) throw new BadRequestException('无法解析 GitHub 仓库地址，请检查 repoUrl');
    return { owner: m[1], repo: m[2] };
  }

  private githubHeaders(): Record<string, string> {
    const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
    // 可选：配置 GITHUB_TOKEN 提升 API 速率限制（60 → 5000/小时）
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    return headers;
  }

  /** 同步 GitHub 数据：stars/forks/issues/language/license/最新版本 */
  async syncGithub(id: number): Promise<Product> {
    const entity = await this.findById(id);
    if (!entity.repoUrl) throw new BadRequestException('请先填写仓库地址 repoUrl');
    const { owner, repo } = this.parseRepoUrl(entity.repoUrl);
    const headers = this.githubHeaders();

    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    if (res.status === 404) throw new BadRequestException('GitHub 仓库不存在或为私有');
    if (!res.ok) throw new BadRequestException(`GitHub API 返回 ${res.status}`);
    const data: any = await res.json();

    entity.githubStars = data.stargazers_count || 0;
    entity.githubForks = data.forks_count || 0;
    entity.githubOpenIssues = data.open_issues_count || 0;
    entity.githubLicense = data.license?.spdx_id || null;
    entity.githubUpdatedAt = data.updated_at || null;
    if (data.language) entity.language = data.language;
    // 自动填充主页地址与描述（留空时）
    if (!entity.homepage && data.homepage) entity.homepage = data.homepage;

    // 若无版本号，尝试拉取最新 release
    if (!entity.version) {
      try {
        const relRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/latest`, { headers });
        if (relRes.ok) {
          const rel: any = await relRes.json();
          if (rel.tag_name) entity.version = rel.tag_name.replace(/^v/, '');
        }
      } catch {
        /* release 拉取失败不阻断同步 */
      }
    }

    entity.githubSyncedAt = new Date().toISOString();
    const saved = await this.repo.save(entity);
    return this.toDto(saved);
  }
}