export interface SiteConfig {
  id: number;
  siteName: string;
  slogan: string;
  description: string;
  siteUrl?: string;
  logoUrl?: string;
  github?: string;
  email?: string;
  twitter?: string;
  /** ICP 备案号 */
  icp?: string;
  /** 公安网备案号 */
  policeRecord?: string;
  /** 第三方统计代码（如百度统计、Google Analytics，原样插入页面） */
  analyticsCode?: string;
  /** SEO 关键词 */
  seoKeywords?: string;
  /** SEO OG 分享图片 URL */
  seoOgImage?: string;
  /** robots 指令（如 index, follow） */
  seoRobots?: string;
  /** twitter:site 账号 */
  seoTwitter?: string;
  /** AI 服务商标识（如 deepseek / zhipu / openai） */
  aiProvider?: string;
  /** AI 接口地址（OpenAI 兼容，如 https://api.deepseek.com/v1） */
  aiBaseUrl?: string;
  /** AI 接口密钥（仅 admin 可读，前台公开接口不返回） */
  aiApiKey?: string;
  /** AI 模型名（如 deepseek-chat / glm-4-flash / gpt-4o-mini） */
  aiModel?: string;
  /** Giscus 评论配置（基于 GitHub Discussions，前端渲染评论挂件） */
  giscusRepo?: string;
  giscusRepoId?: string;
  giscusCategory?: string;
  giscusCategoryId?: string;
  /** SMTP 邮件配置（Newsletter / 通知），smtpPass 仅 admin 可读 */
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPass?: string;
  smtpFrom?: string;
  /** Webhook 推送地址（多个用逗号或换行分隔），留空则不推送 */
  webhookUrls?: string;
  content?: PageContent;
  createdAt: string;
  updatedAt: string;
}

/** 前台可编辑的页面展示文案（除底部版权外） */
export interface PageContent {
  hero: {
    badge: string;
    titleLine1: string;
    titleLine2: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
  features: {
    eyebrow: string;
    title: string;
    subtitle: string;
    items: { icon: string; title: string; desc: string; tone: string }[];
  };
  stats: { value: string; label: string }[];
  cta: { title: string; subtitle: string; primary: string; secondary: string };
  projects: {
    featuredEyebrow: string;
    featuredTitle: string;
    featuredSub: string;
    allEyebrow: string;
    allTitle: string;
    allSub: string;
    viewAll: string;
  };
  about: {
    eyebrow: string;
    title: string;
    introTitle: string;
    introText: string;
    values: { icon: string; title: string; desc: string; tone: string }[];
    contactTitle: string;
  };
}

export interface Product {
  id: number;
  /** 产品 slug，用于 URL */
  slug: string;
  name: string;
  tagline: string;
  description: string;
  /** 富文本/文档内容 */
  content?: string;
  logoUrl?: string;
  /** 截图，逗号分隔的 URL */
  screenshots?: string;
  tags?: string;
  repoUrl?: string;
  homepage?: string;
  docsUrl?: string;
  /** 当前版本 */
  version?: string;
  status: 'published' | 'draft' | 'archived';
  featured: boolean;
  sortOrder: number;
  /** 定时发布时间（到达后自动发布） */
  scheduledAt?: string;
  /** 浏览量 */
  viewCount: number;
  /** 点赞数 */
  likeCount: number;
  /** 主编程语言（GitHub 同步） */
  language?: string;
  /** 分类（手动） */
  category?: string;
  /** GitHub 同步数据 */
  githubStars: number;
  githubForks: number;
  githubOpenIssues: number;
  githubLicense?: string;
  githubUpdatedAt?: string;
  githubSyncedAt?: string;
  /** SEO 标题（留空则用 name） */
  seoTitle?: string;
  /** SEO 描述（留空则用 tagline/description） */
  seoDescription?: string;
  /** SEO 关键词（逗号分隔，留空则用 tags） */
  seoKeywords?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Article {
  id: number;
  slug: string;
  title: string;
  summary?: string;
  content?: string;
  coverUrl?: string;
  tags?: string;
  status: 'published' | 'draft';
  publishedAt?: string;
  /** 定时发布时间（到达后自动发布） */
  scheduledAt?: string;
  /** SEO 标题（留空则用 title） */
  seoTitle?: string;
  /** SEO 描述（留空则用 summary） */
  seoDescription?: string;
  /** SEO 关键词（逗号分隔，留空则用 tags） */
  seoKeywords?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: number;
  username: string;
  role: 'admin';
  createdAt: string;
}

export interface ProjectSubmission {
  id: number;
  name: string;
  tagline: string;
  description: string;
  repoUrl?: string;
  homepage?: string;
  author?: string;
  email?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitProjectPayload {
  name: string;
  tagline?: string;
  description?: string;
  repoUrl?: string;
  homepage?: string;
  author?: string;
  email?: string;
}

/** 审核通过并创建产品的结果 */
export interface ApproveAndCreateResult {
  submission: ProjectSubmission;
  product: Product;
}

/** AI 生成 SEO 的请求参数 */
export interface AiSeoGeneratePayload {
  /** 类型：产品 / 文章 */
  type: 'product' | 'article';
  /** 标题（产品名 / 文章标题） */
  name: string;
  /** 正文内容（Markdown） */
  content?: string;
  /** 现有标签，供 AI 参考 */
  tags?: string;
}

/** AI 生成 SEO 的返回结果 */
export interface AiSeoResult {
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
}

/** 审计日志条目 */
export interface AuditLogEntry {
  id: number;
  action: string;
  method?: string;
  path: string;
  target?: string;
  targetId?: number;
  userId?: number;
  username?: string;
  ip?: string;
  detail?: string;
  status?: number;
  createdAt: string;
}

/** 后台仪表盘聚合统计 */
export interface DashboardStats {
  products: { total: number; published: number };
  articles: { total: number; published: number };
  submissions: { total: number; pending: number };
  /** 互动汇总 */
  engagement: {
    totalViews: number;
    totalLikes: number;
    totalStars: number;
  };
  /** 其他实体计数 */
  counts: {
    members: number;
    topics: number;
    subscribers: number;
    media: number;
  };
  /** 浏览量 Top 产品 */
  topProducts: {
    id: number;
    slug: string;
    name: string;
    viewCount: number;
    likeCount: number;
    githubStars: number;
  }[];
  recentSubmissions: ProjectSubmission[];
  recentAudit: AuditLogEntry[];
}

/** 前台公开的站点聚合统计（首页数字带） */
export interface SiteStats {
  /** 已发布产品数 */
  products: number;
  /** 已发布文章数 */
  articles: number;
  /** 全部产品 GitHub Star 汇总 */
  totalStars: number;
  /** 全部产品浏览量汇总 */
  totalViews: number;
  /** 全部产品点赞汇总 */
  totalLikes: number;
  /** 团队成员数 */
  members: number;
}

/** 活动流条目（首页「最近动态」聚合展示） */
export interface ActivityItem {
  /** 条目类型：新上架产品 / 新发布文章 / 新版本发布 */
  type: 'product' | 'article' | 'release';
  /** 标题 */
  title: string;
  /** 跳转 slug（产品 / 文章详情） */
  slug?: string;
  /** 摘要描述 */
  description?: string;
  /** 发生时间（ISO） */
  time: string;
  /** 附加元信息（如版本号、语言） */
  meta?: string;
}

/** 项目健康度徽章（基于 GitHub 数据自动计算） */
export interface HealthBadge {
  /** 徽章键：active / maintained / stale / popular / licensed / newcommer */
  key: string;
  /** 展示文案 */
  label: string;
  /** 视觉色调：green / yellow / red / gray / blue */
  tone: 'green' | 'yellow' | 'red' | 'gray' | 'blue';
  /** 徽章图标 emoji */
  icon?: string;
}

/** 团队成员 */
export interface Member {
  id: number;
  name: string;
  /** 角色 / 头衔（如：创始人 / 维护者 / 贡献者） */
  role: string;
  /** 简介 */
  bio?: string;
  /** 头像 URL */
  avatarUrl?: string;
  /** GitHub 链接 */
  github?: string;
  /** Twitter / X 链接 */
  twitter?: string;
  /** 邮箱 */
  email?: string;
  /** 个人站点 */
  website?: string;
  /** 排序值（越小越靠前） */
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/** 内容修订历史快照（产品 / 文章每次保存留档，可回滚） */
export interface Revision {
  id: number;
  /** 实体类型：product / article */
  entityType: 'product' | 'article';
  /** 实体 ID */
  entityId: number;
  /** 快照内容（实体完整字段 JSON） */
  snapshot: Record<string, any>;
  /** 操作人 */
  username?: string;
  createdAt: string;
}

/** 媒体库文件记录 */
export interface Media {
  id: number;
  url: string;
  /** 原始文件名 */
  filename: string;
  mimetype?: string;
  size?: number;
  createdAt: string;
}

/** 专题（策展集合，关联多个产品） */
export interface Topic {
  id: number;
  slug: string;
  name: string;
  description?: string;
  coverUrl?: string;
  sortOrder: number;
  /** 专题下关联的产品（详情接口返回） */
  products?: Product[];
  /** 关联产品 ID 列表（编辑接口接收） */
  productIds?: number[];
  createdAt: string;
  updatedAt: string;
}

/** Newsletter 订阅者 */
export interface Subscriber {
  id: number;
  email: string;
  /** 是否已确认邮箱 */
  confirmed: boolean;
  createdAt: string;
}

/** 数据备份导出包 */
export interface BackupPayload {
  version: number;
  exportedAt: string;
  siteConfig?: Partial<SiteConfig>;
  products?: Product[];
  articles?: Article[];
  members?: Member[];
  topics?: Topic[];
}

/** 批量操作请求 */
export interface BulkActionPayload {
  ids: number[];
  action: 'publish' | 'draft' | 'archive' | 'delete';
}

/** 批量操作结果 */
export interface BulkActionResult {
  affected: number;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginResult {
  user: User;
  /** 首次登录强制改密：为 true 时前端需弹窗强制改密 */
  mustChangePassword?: boolean;
}
