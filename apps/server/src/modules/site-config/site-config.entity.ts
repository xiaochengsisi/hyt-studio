import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('site_config')
export class SiteConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 'HYT Studio' })
  siteName: string;

  @Column({ default: '' })
  slogan: string;

  @Column({ type: 'text', default: '' })
  description: string;

  /** 站点对外访问地址（用于 RSS / sitemap 的绝对链接） */
  @Column({ nullable: true })
  siteUrl?: string;

  /** 前台页面展示文案（JSON 字符串） */
  @Column({ type: 'text', nullable: true })
  content?: string;

  @Column({ nullable: true })
  logoUrl?: string;

  @Column({ nullable: true })
  github?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  twitter?: string;

  /** ICP 备案号 */
  @Column({ nullable: true })
  icp?: string;

  /** 公安网备案号 */
  @Column({ nullable: true })
  policeRecord?: string;

  /** 第三方统计代码（原样插入前台页面） */
  @Column({ type: 'text', nullable: true })
  analyticsCode?: string;

  /** SEO 关键词 */
  @Column({ nullable: true })
  seoKeywords?: string;

  /** SEO OG 分享图片 URL */
  @Column({ nullable: true })
  seoOgImage?: string;

  /** robots 指令（如 index, follow） */
  @Column({ nullable: true })
  seoRobots?: string;

  /** twitter:site 账号 */
  @Column({ nullable: true })
  seoTwitter?: string;

  /** AI 服务商标识（如 deepseek / zhipu / openai） */
  @Column({ nullable: true })
  aiProvider?: string;

  /** AI 接口地址（OpenAI 兼容） */
  @Column({ nullable: true })
  aiBaseUrl?: string;

  /** AI 接口密钥 */
  @Column({ type: 'text', nullable: true })
  aiApiKey?: string;

  /** AI 模型名 */
  @Column({ nullable: true })
  aiModel?: string;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: string;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: string;
}