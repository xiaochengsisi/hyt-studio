import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Revision as RevisionDto } from '@hyt/shared';
import { Revision } from './revision.entity';
import { Product } from '../products/product.entity';
import { Article } from '../articles/article.entity';

@Injectable()
export class RevisionsService {
  constructor(
    @InjectRepository(Revision) private readonly repo: Repository<Revision>,
    @InjectRepository(Product) private readonly products: Repository<Product>,
    @InjectRepository(Article) private readonly articles: Repository<Article>,
  ) {}

  private toDto(e: Revision): RevisionDto {
    let snapshot: Record<string, any>;
    try {
      snapshot = JSON.parse(e.snapshot || '{}');
    } catch {
      snapshot = {};
    }
    return {
      id: e.id,
      entityType: e.entityType,
      entityId: e.entityId,
      snapshot,
      username: e.username,
      createdAt: e.createdAt,
    };
  }

  /** 保存一份快照（在 create / update 后调用） */
  async saveSnapshot(
    entityType: 'product' | 'article',
    entityId: number,
    data: Record<string, any>,
    username?: string,
  ): Promise<void> {
    const rev = this.repo.create({
      entityType,
      entityId,
      snapshot: JSON.stringify(data),
      username,
    });
    await this.repo.save(rev);
  }

  /** 列出某实体的修订历史（最新在前） */
  async list(entityType: 'product' | 'article', entityId: number): Promise<RevisionDto[]> {
    const items = await this.repo.find({
      where: { entityType, entityId },
      order: { id: 'DESC' },
      take: 50,
    });
    return items.map((e) => this.toDto(e));
  }

  async getOne(id: number): Promise<RevisionDto> {
    const e = await this.repo.findOne({ where: { id } });
    if (!e) throw new NotFoundException('修订记录不存在');
    return this.toDto(e);
  }

  /** 回滚：把快照写回实体 */
  async rollback(id: number): Promise<RevisionDto> {
    const rev = await this.repo.findOne({ where: { id } });
    if (!rev) throw new NotFoundException('修订记录不存在');
    let snapshot: Record<string, any>;
    try {
      snapshot = JSON.parse(rev.snapshot);
    } catch {
      throw new NotFoundException('修订快照损坏');
    }

    if (rev.entityType === 'product') {
      const entity = await this.products.findOne({ where: { id: rev.entityId } });
      if (!entity) throw new NotFoundException('目标产品已不存在');
      // 保留 id / 时间戳，其余字段从快照恢复
      const { id, createdAt, updatedAt, deletedAt, ...rest } = snapshot;
      Object.assign(entity, rest);
      await this.products.save(entity);
      // 回滚后也留档当前状态，便于再次回滚
      await this.saveSnapshot('product', rev.entityId, snapshot, rev.username);
    } else {
      const entity = await this.articles.findOne({ where: { id: rev.entityId } });
      if (!entity) throw new NotFoundException('目标文章已不存在');
      const { id, createdAt, updatedAt, deletedAt, ...rest } = snapshot;
      Object.assign(entity, rest);
      await this.articles.save(entity);
      await this.saveSnapshot('article', rev.entityId, snapshot, rev.username);
    }
    return this.toDto(rev);
  }
}
