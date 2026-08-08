import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Translation } from './translation.entity';

export type EntityType = 'product' | 'article';

export interface TranslationFields {
  [key: string]: string | undefined;
}

@Injectable()
export class TranslationsService {
  constructor(
    @InjectRepository(Translation) private readonly repo: Repository<Translation>,
  ) {}

  /** 列出某实体的所有翻译 */
  async list(entityType: EntityType, entityId: number): Promise<{ locale: string; fields: TranslationFields }[]> {
    const rows = await this.repo.find({
      where: { entityType, entityId },
      order: { locale: 'ASC' },
    });
    return rows.map((r) => ({ locale: r.locale, fields: this.parse(r.fields) }));
  }

  /** 取某 locale 的翻译字段，无则返回空对象 */
  async get(entityType: EntityType, entityId: number, locale: string): Promise<TranslationFields> {
    const row = await this.repo.findOne({ where: { entityType, entityId, locale } });
    return row ? this.parse(row.fields) : {};
  }

  /** 保存某 locale 的翻译（upsert） */
  async set(
    entityType: EntityType,
    entityId: number,
    locale: string,
    fields: TranslationFields,
  ): Promise<void> {
    const existing = await this.repo.findOne({ where: { entityType, entityId, locale } });
    if (existing) {
      existing.fields = JSON.stringify(fields);
      await this.repo.save(existing);
    } else {
      const row = this.repo.create({
        entityType,
        entityId,
        locale,
        fields: JSON.stringify(fields),
      });
      await this.repo.save(row);
    }
  }

  /** 删除某 locale 的翻译 */
  async remove(entityType: EntityType, entityId: number, locale: string): Promise<void> {
    await this.repo.delete({ entityType, entityId, locale });
  }

  /** 实体被删除时清理对应翻译 */
  async purgeEntity(entityType: EntityType, entityId: number): Promise<void> {
    await this.repo.delete({ entityType, entityId });
  }

  private parse(s: string): TranslationFields {
    try {
      return JSON.parse(s) || {};
    } catch {
      return {};
    }
  }
}
