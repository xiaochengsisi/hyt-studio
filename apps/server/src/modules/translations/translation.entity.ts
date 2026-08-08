import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 多语言内容翻译：
 * 针对产品 / 文章的多语言版本，按 (entityType, entityId, locale) 唯一。
 * fields 字段存储 JSON：{ name, tagline, description, content, summary, ... }
 * 取产品/文章详情时按 Accept-Language 或 ?lang= 合并对应翻译。
 */
@Entity('translations')
@Index('idx_translation_entity', ['entityType', 'entityId'])
@Index('UQ_translation_entity_locale', ['entityType', 'entityId', 'locale'], { unique: true })
export class Translation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  entityType: 'product' | 'article';

  @Column()
  entityId: number;

  /** 语言代码，如 en-US / zh-CN / ja-JP */
  @Column()
  locale: string;

  /** 翻译字段 JSON 字符串 */
  @Column({ type: 'text' })
  fields: string;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: string;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: string;
}
