import type {
  ApiResponse,
  Paginated,
  Product,
  SiteConfig,
  Article,
  ProjectSubmission,
  SubmitProjectPayload,
  SiteStats,
  ActivityItem,
  Member,
  Topic,
  HealthBadge,
} from '@hyt/shared';

const BASE = '/api';

/** 默认请求超时：15s，避免网络异常时请求无限挂起 */
const DEFAULT_TIMEOUT = 15_000;

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);
  let res: Response;
  try {
    res = await fetch(`${BASE}${url}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      ...options,
    });
  } catch (e: unknown) {
    clearTimeout(timer);
    throw new Error(
      e instanceof Error && e.name === 'AbortError' ? '请求超时，请稍后重试' : '网络异常，请检查网络后重试',
      { cause: e },
    );
  }
  clearTimeout(timer);

  // 非 JSON 响应（如 502 网关返回 HTML 错误页）不直接 res.json()，避免抛技术性解析错误
  const ct = res.headers.get('content-type') || '';
  if (!res.ok || !ct.includes('application/json')) {
    throw new Error(`请求失败（${res.status}），请稍后重试`);
  }
  const body: ApiResponse<T> = await res.json();
  if (body.code !== 0) {
    const msg = Array.isArray(body.message) ? body.message.join('; ') : body.message;
    throw new Error(msg || '请求失败');
  }
  return body.data;
}

export const api = {
  getSiteConfig: () => request<SiteConfig>('/site-config'),
  getProducts: (params?: {
    feature?: boolean;
    page?: number;
    pageSize?: number;
    keyword?: string;
    tag?: string;
    language?: string;
    category?: string;
    sort?: 'default' | 'hot' | 'views' | 'likes' | 'stars' | 'newest';
  }) => {
    const q = new URLSearchParams();
    if (params?.feature) q.set('feature', 'true');
    if (params?.page) q.set('page', String(params.page));
    if (params?.pageSize) q.set('pageSize', String(params.pageSize));
    if (params?.keyword) q.set('keyword', params.keyword);
    if (params?.tag) q.set('tag', params.tag);
    if (params?.language) q.set('language', params.language);
    if (params?.category) q.set('category', params.category);
    if (params?.sort) q.set('sort', params.sort);
    const s = q.toString();
    return request<Paginated<Product>>(`/products${s ? '?' + s : ''}`);
  },
  getProduct: (slug: string) => request<Product>(`/products/slug/${slug}`),
  getRelatedProducts: (slug: string) => request<Product[]>(`/products/slug/${slug}/related`),
  getHealthBadges: (slug: string) =>
    request<{ badges: HealthBadge[] }>(`/products/slug/${slug}/health`),
  getProductsTags: () => request<{ name: string; count: number }[]>('/products/tags'),
  getProductsLanguages: () => request<{ name: string; count: number }[]>('/products/languages'),
  getHotProducts: () => request<Product[]>('/products/hot'),
  toggleLike: (slug: string, anonId: string) =>
    request<{ liked: boolean; likeCount: number }>(`/products/slug/${slug}/like`, {
      method: 'POST',
      body: JSON.stringify({ anonId }),
    }),
  getArticles: (params?: { page?: number; pageSize?: number; keyword?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.pageSize) q.set('pageSize', String(params.pageSize));
    if (params?.keyword) q.set('keyword', params.keyword);
    const s = q.toString();
    return request<Paginated<Article>>(`/articles${s ? '?' + s : ''}`);
  },
  getArticle: (slug: string) => request<Article>(`/articles/slug/${slug}`),
  submitProject: (data: SubmitProjectPayload) =>
    request<ProjectSubmission>('/submissions', { method: 'POST', body: JSON.stringify(data) }),

  // 公开统计与活动流（首页数字带 + 最近动态）
  getSiteStats: () => request<SiteStats>('/stats/public'),
  getActivity: (limit = 8) => request<ActivityItem[]>(`/stats/activity?limit=${limit}`),

  // 团队成员（前台 /team）
  getMembers: () => request<Member[]>('/members'),

  // 专题（策展集合）
  getTopics: () => request<Topic[]>('/topics'),
  getTopic: (slug: string) => request<Topic>(`/topics/slug/${slug}`),

  // Newsletter 订阅
  subscribe: (email: string) =>
    request<{ pending: boolean }>('/subscribers/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  unsubscribe: (email: string) =>
    request<void>('/subscribers/unsubscribe', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
};