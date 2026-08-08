import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApproveAndCreateResult, Paginated, Product, ProjectSubmission } from '@hyt/shared';
import { Submission as SubmissionEntity } from './submission.entity';
import { ProductsService } from '../products/products.service';
import { WebhookService } from '../webhook/webhook.service';

export interface QuerySubmissions {
  page?: number;
  pageSize?: number;
  status?: string;
  keyword?: string;
}

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectRepository(SubmissionEntity)
    private readonly repo: Repository<SubmissionEntity>,
    private readonly productsService: ProductsService,
    private readonly webhook: WebhookService,
  ) {}

  private toDto(e: SubmissionEntity): ProjectSubmission {
    return {
      id: e.id,
      name: e.name,
      tagline: e.tagline,
      description: e.description,
      repoUrl: e.repoUrl,
      homepage: e.homepage,
      author: e.author,
      email: e.email,
      status: e.status,
      reviewNote: e.reviewNote,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    };
  }

  /** 前台提交（公开，无需登录） */
  async create(data: Partial<SubmissionEntity>): Promise<ProjectSubmission> {
    const name = (data.name || '').trim();
    if (name.length < 2) throw new BadRequestException('项目名称至少 2 个字符');
    if (!data.repoUrl && !data.homepage)
      throw new BadRequestException('请至少填写仓库地址或项目主页');
    const entity = this.repo.create({
      ...data,
      name,
      status: data.status || 'pending',
    });
    const saved = await this.repo.save(entity);
    void this.webhook.emit('submission.created', {
      id: saved.id,
      name: saved.name,
      author: saved.author,
      repoUrl: saved.repoUrl,
    });
    return this.toDto(saved);
  }

  /** 后台审核列表 */
  async list(query: QuerySubmissions): Promise<Paginated<ProjectSubmission>> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const qb = this.repo.createQueryBuilder('s');
    if (query.status) qb.andWhere('s.status = :status', { status: query.status });
    if (query.keyword) {
      const kw = `%${query.keyword}%`;
      qb.andWhere('(s.name LIKE :kw OR s.tagline LIKE :kw OR s.author LIKE :kw OR s.email LIKE :kw)', {
        kw,
      });
    }
    qb.orderBy('s.id', 'DESC')
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

  async findById(id: number): Promise<SubmissionEntity> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('提交不存在');
    return entity;
  }

  /** 审核：更新状态（approved/rejected）及备注 */
  async review(id: number, status: 'approved' | 'rejected', note?: string): Promise<ProjectSubmission> {
    if (!['approved', 'rejected'].includes(status))
      throw new BadRequestException('审核状态必须是 approved 或 rejected');
    const entity = await this.findById(id);
    entity.status = status;
    entity.reviewNote = note || entity.reviewNote;
    const saved = await this.repo.save(entity);
    return this.toDto(saved);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findById(id);
    await this.repo.remove(entity);
  }

  /**
   * 审核通过并一键创建产品草稿：
   * 把提交的项目字段带入新产品（draft 状态），管理员可在编辑页继续完善后发布。
   */
  async approveAndCreate(id: number): Promise<ApproveAndCreateResult> {
    const entity = await this.findById(id);
    const product = await this.createProductFromSubmission(entity);

    entity.status = 'approved';
    entity.reviewNote = entity.reviewNote || '已通过并创建为产品草稿';
    const saved = await this.repo.save(entity);
    return { submission: this.toDto(saved), product };
  }

  private async createProductFromSubmission(s: SubmissionEntity): Promise<Product> {
    const baseSlug = this.slugify(s.name) || `project-${s.id}`;
    // 生成唯一 slug：冲突时追加 -2 / -3 …
    let slug = baseSlug;
    let attempt = 0;
    while (true) {
      try {
        return await this.productsService.create({
          name: s.name,
          slug,
          tagline: s.tagline || '',
          description: s.description || '',
          repoUrl: s.repoUrl || undefined,
          homepage: s.homepage || undefined,
          status: 'draft',
          featured: false,
          sortOrder: 0,
        });
      } catch (e) {
        if (e instanceof ConflictException && attempt < 20) {
          attempt += 1;
          slug = `${baseSlug}-${attempt}`;
        } else {
          throw e;
        }
      }
    }
  }

  /** 将名称转为 URL slug；非拉丁字符会被剔除，调用方需处理空值回退 */
  private slugify(input: string): string {
    return (input || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);
  }
}