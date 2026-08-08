import type {
  ApiResponse,
  Paginated,
  Product,
  SiteConfig,
  Article,
  ProjectSubmission,
  SubmitProjectPayload,
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
  }) => {
    const q = new URLSearchParams();
    if (params?.feature) q.set('feature', 'true');
    if (params?.page) q.set('page', String(params.page));
    if (params?.pageSize) q.set('pageSize', String(params.pageSize));
    if (params?.keyword) q.set('keyword', params.keyword);
    if (params?.tag) q.set('tag', params.tag);
    const s = q.toString();
    return request<Paginated<Product>>(`/products${s ? '?' + s : ''}`);
  },
  getProduct: (slug: string) => request<Product>(`/products/slug/${slug}`),
  getRelatedProducts: (slug: string) => request<Product[]>(`/products/slug/${slug}/related`),
  getProductsTags: () => request<{ name: string; count: number }[]>('/products/tags'),
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
};