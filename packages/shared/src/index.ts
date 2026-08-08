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
  recentSubmissions: ProjectSubmission[];
  recentAudit: AuditLogEntry[];
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
  token: string;
  user: User;
  /** 首次登录强制改密：为 true 时前端需弹窗强制改密 */
  mustChangePassword?: boolean;
}