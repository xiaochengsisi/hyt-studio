import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  slug: string;

  @Column()
  name: string;

  @Column({ default: '' })
  tagline: string;

  @Column({ type: 'text', default: '' })
  description: string;

  @Column({ type: 'text', nullable: true })
  content?: string;

  @Column({ nullable: true })
  logoUrl?: string;

  @Column({ type: 'text', nullable: true })
  screenshots?: string;

  @Column({ nullable: true })
  tags?: string;

  @Column({ nullable: true })
  repoUrl?: string;

  @Column({ nullable: true })
  homepage?: string;

  @Column({ nullable: true })
  docsUrl?: string;

  @Column({ nullable: true })
  version?: string;

  @Column({ default: 'draft' })
  status: 'published' | 'draft' | 'archived';

  @Column({ default: false })
  featured: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  /** 浏览量（详情页访问计数） */
  @Column({ default: 0 })
  viewCount: number;

  /** 点赞数（前台匿名点赞累计） */
  @Column({ default: 0 })
  likeCount: number;

  /** 主编程语言（可由 GitHub 同步填充，用于筛选） */
  @Column({ nullable: true })
  language?: string;

  /** 分类（手动选择，用于结构化筛选） */
  @Column({ nullable: true })
  category?: string;

  /** GitHub 同步数据 */
  @Column({ default: 0 })
  githubStars: number;
  @Column({ default: 0 })
  githubForks: number;
  @Column({ default: 0 })
  githubOpenIssues: number;
  @Column({ nullable: true })
  githubLicense?: string;
  @Column({ type: 'datetime', nullable: true })
  githubUpdatedAt?: string;
  @Column({ type: 'datetime', nullable: true })
  githubSyncedAt?: string;

  /** SEO 标题（留空则用 name） */
  @Column({ nullable: true })
  seoTitle?: string;

  /** SEO 描述（留空则用 tagline/description） */
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