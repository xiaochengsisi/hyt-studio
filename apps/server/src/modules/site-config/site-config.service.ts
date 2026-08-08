import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PageContent, SiteConfig as SiteConfigDto } from '@hyt/shared';
import { SiteConfig as SiteConfigEntity } from './site-config.entity';

@Injectable()
export class SiteConfigService {
  constructor(
    @InjectRepository(SiteConfigEntity)
    private readonly repo: Repository<SiteConfigEntity>,
  ) {}

  private toDto(e: SiteConfigEntity, withSecrets = false): SiteConfigDto {
    let content: PageContent | undefined;
    if (e.content) {
      try {
        content = JSON.parse(e.content);
      } catch {
        content = undefined;
      }
    }
    return {
      id: e.id,
      siteName: e.siteName,
      slogan: e.slogan,
      description: e.description,
      siteUrl: e.siteUrl,
      content,
      logoUrl: e.logoUrl,
      github: e.github,
      email: e.email,
      twitter: e.twitter,
      icp: e.icp,
      policeRecord: e.policeRecord,
      analyticsCode: e.analyticsCode,
      seoKeywords: e.seoKeywords,
      seoOgImage: e.seoOgImage,
      seoRobots: e.seoRobots,
      seoTwitter: e.seoTwitter,
      aiProvider: e.aiProvider,
      aiBaseUrl: e.aiBaseUrl,
      // API Key 仅在 admin 上下文返回，公开接口不暴露
      aiApiKey: withSecrets ? e.aiApiKey : undefined,
      aiModel: e.aiModel,
      giscusRepo: e.giscusRepo,
      giscusRepoId: e.giscusRepoId,
      giscusCategory: e.giscusCategory,
      giscusCategoryId: e.giscusCategoryId,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    };
  }

  /** 公开配置（不含 AI Key） */
  async getConfig(): Promise<SiteConfigDto> {
    let entity = await this.repo.findOne({ where: {} });
    if (!entity) {
      entity = this.repo.create({});
      entity = await this.repo.save(entity);
    }
    return this.toDto(entity);
  }

  /** 管理员配置（含 AI Key，仅供后台读取） */
  async getAdminConfig(): Promise<SiteConfigDto> {
    let entity = await this.repo.findOne({ where: {} });
    if (!entity) {
      entity = this.repo.create({});
      entity = await this.repo.save(entity);
    }
    return this.toDto(entity, true);
  }

  async updateConfig(data: Partial<SiteConfigEntity>): Promise<SiteConfigDto> {
    let entity = await this.repo.findOne({ where: {} });
    if (!entity) {
      entity = this.repo.create({});
    }
    if (data.content && typeof data.content !== 'string') {
      data.content = JSON.stringify(data.content);
    }
    Object.assign(entity, data);
    entity = await this.repo.save(entity);
    return this.toDto(entity, true);
  }
}