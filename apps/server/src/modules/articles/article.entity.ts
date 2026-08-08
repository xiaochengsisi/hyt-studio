import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('articles')
export class Article {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  slug: string;

  @Column()
  title: string;

  @Column({ type: 'text', default: '' })
  summary?: string;

  @Column({ type: 'text', nullable: true })
  content?: string;

  @Column({ nullable: true })
  coverUrl?: string;

  @Column({ nullable: true })
  tags?: string;

  @Column({ default: 'draft' })
  status: 'published' | 'draft';

  /** 定时发布时间：到达后调度器自动把 draft → published */
  @Column({ type: 'datetime', nullable: true })
  scheduledAt?: string;

  @Column({ type: 'datetime', nullable: true })
  publishedAt?: string;

  /** SEO 标题（留空则用 title） */
  @Column({ nullable: true })
  seoTitle?: string;

  /** SEO 描述（留空则用 summary） */
  @Column({ type: 'text', nullable: true })
  seoDescription?: string;

  /** SEO 关键词（逗号分隔，留空则用 tags） */
  @Column({ nullable: true })
  seoKeywords?: string;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: string;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: string;

  /** 软删除：删除后不真正移除，可在数据库中恢复 */
  @DeleteDateColumn({ type: 'datetime', nullable: true })
  deletedAt?: string;
}