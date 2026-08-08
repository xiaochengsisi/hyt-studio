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