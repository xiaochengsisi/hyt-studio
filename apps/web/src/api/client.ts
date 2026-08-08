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
} from '@hyt/shared';

const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
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
};