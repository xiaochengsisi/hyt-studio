import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * 内容修订历史：产品 / 文章每次保存留档一份完整快照，支持回滚。
 */
@Entity('revisions')
@Index('idx_revision_entity', ['entityType', 'entityId'])
export class Revision {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  entityType: 'product' | 'article';

  @Column()
  entityId: number;

  /** 完整字段快照（JSON 字符串） */
  @Column({ type: 'text' })
  snapshot: string;

  @Column({ nullable: true })
  username?: string;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: string;
}
