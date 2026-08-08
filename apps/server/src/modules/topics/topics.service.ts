import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Product, Topic as TopicDto } from '@hyt/shared';
import { Topic } from './topic.entity';
import { Product as ProductEntity } from '../products/product.entity';

@Injectable()
export class TopicsService {
  constructor(
    @InjectRepository(Topic) private readonly repo: Repository<Topic>,
    @InjectRepository(ProductEntity) private readonly products: Repository<ProductEntity>,
  ) {}

  private toDto(e: Topic, withProducts = false): TopicDto {
    return {
      id: e.id,
      slug: e.slug,
      name: e.name,
      description: e.description,
      coverUrl: e.coverUrl,
      sortOrder: e.sortOrder,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
      ...(withProducts && e.products
        ? {
            products: e.products.map((p) => ({
              id: p.id,
              slug: p.slug,
              name: p.name,
              tagline: p.tagline,
              description: p.description,
              logoUrl: p.logoUrl,
              screenshots: p.screenshots,
              tags: p.tags,
              repoUrl: p.repoUrl,
              homepage: p.homepage,
              docsUrl: p.docsUrl,
              version: p.version,
              status: p.status,
              featured: p.featured,
              sortOrder: p.sortOrder,
              viewCount: p.viewCount,
              likeCount: p.likeCount,
              language: p.language,
              category: p.category,
              githubStars: p.githubStars,
              githubForks: p.githubForks,
              githubOpenIssues: p.githubOpenIssues,
              githubLicense: p.githubLicense,
              githubUpdatedAt: p.githubUpdatedAt,
              githubSyncedAt: p.githubSyncedAt,
              createdAt: p.createdAt,
              updatedAt: p.updatedAt,
            })) as Product[],
          }
        : {}),
    };
  }

  async listPublic(): Promise<TopicDto[]> {
    const items = await this.repo.find({ order: { sortOrder: 'ASC', id: 'ASC' } });
    return items.map((e) => this.toDto(e));
  }

  async listAll(): Promise<TopicDto[]> {
    const items = await this.repo.find({ order: { sortOrder: 'ASC', id: 'ASC' } });
    return items.map((e) => this.toDto(e));
  }

  async findBySlug(slug: string): Promise<TopicDto> {
    const e = await this.repo.findOne({
      where: { slug },
      relations: ['products'],
    });
    if (!e) throw new NotFoundException('专题不存在');
    // 仅展示专题下已发布产品
    e.products = (e.products || []).filter((p) => p.status === 'published');
    return this.toDto(e, true);
  }

  async findById(id: number): Promise<Topic> {
    const e = await this.repo.findOne({ where: { id } });
    if (!e) throw new NotFoundException('专题不存在');
    return e;
  }

  private async assertSlugUnique(slug?: string, excludeId?: number): Promise<void> {
    if (!slug) return;
    const qb = this.repo.createQueryBuilder('t').where('t.slug = :slug', { slug });
    if (excludeId) qb.andWhere('t.id != :excludeId', { excludeId });
    if (await qb.getOne()) throw new ConflictException(`slug「${slug}」已被占用`);
  }

  async create(data: Partial<Topic> & { productIds?: number[] }): Promise<TopicDto> {
    await this.assertSlugUnique(data.slug);
    const { productIds, ...rest } = data;
    const entity = this.repo.create(rest);
    if (productIds?.length) {
      entity.products = await this.products.find({ where: { id: In(productIds) } });
    }
    const saved = await this.repo.save(entity);
    return this.toDto(saved);
  }

  async update(id: number, data: Partial<Topic> & { productIds?: number[] }): Promise<TopicDto> {
    await this.assertSlugUnique(data.slug, id);
    const entity = await this.findById(id);
    const { productIds, ...rest } = data;
    Object.assign(entity, rest);
    if (productIds !== undefined) {
      entity.products = productIds.length
        ? await this.products.find({ where: { id: In(productIds) } })
        : [];
    }
    const saved = await this.repo.save(entity);
    return this.toDto(saved);
  }

  async remove(id: number): Promise<void> {
    await this.repo.softDelete(id);
  }
}
