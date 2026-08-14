import type {
  ApiResponse,
  Paginated,
  Product,
  Article,
  SiteConfig,
  User,
  ProjectSubmission,
  AiSeoResult,
  ApproveAndCreateResult,
  DashboardStats,
  AuditLogEntry,
  BulkActionResult,
  BulkActionPayload,
  Member,
  Revision,
  Media,
  Topic,
  Subscriber,
  BackupPayload,
} from '@hyt/shared';
import { logout, auth } from '../stores/auth';

const BASE = '/api';

/** 默认请求超时：20s，避免网络异常时请求无限挂起 */
const DEFAULT_TIMEOUT = 20_000;

/** 读取 CSRF 双提交令牌（由后端在登录 / 改密 / 恢复会话时下发到内存态 auth store） */
function csrfToken(): string {
  return auth?.csrfToken || '';
}

export async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = csrfToken();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);
  let res: Response;
  try {
    res = await fetch(`${BASE}${url}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'X-CSRF-Token': token } : {}),
      },
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

  // 401：会话失效，清理本地态并跳登录（logout 内部总能清理，无需 await）
  if (res.status === 401) {
    void logout();
    throw new Error('登录已失效，请重新登录');
  }

  // 非 JSON 响应（如 502 网关返回 HTML 错误页）不直接 res.json()，避免抛技术性解析错误
  const ct = res.headers.get('content-type') || '';
  if (!res.ok || !ct.includes('application/json')) {
    throw new Error(`请求失败（${res.status}），请稍后重试`);
  }
  const body: ApiResponse<T> = await res.json();
  if (body.code !== 0) {
    if (body.code === 401) {
      void logout();
      throw new Error('登录已失效，请重新登录');
    }
    const msg = Array.isArray(body.message) ? body.message.join('; ') : body.message;
    throw new Error(msg || '请求失败');
  }
  return body.data;
}

export const adminApi = {
  // products
  listProducts: (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    keyword?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.pageSize) q.set('pageSize', String(params.pageSize));
    if (params?.status) q.set('status', params.status);
    if (params?.keyword) q.set('keyword', params.keyword);
    const s = q.toString();
    return request<Paginated<Product>>(`/products/admin${s ? '?' + s : ''}`);
  },
  getProduct: (id: number) => request<Product>(`/products/admin/${id}`),
  createProduct: (data: Partial<Product>) =>
    request<Product>('/products/admin', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: number, data: Partial<Product>) =>
    request<Product>(`/products/admin/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  syncGithub: (id: number) =>
    request<Product>(`/products/admin/${id}/sync-github`, { method: 'POST' }),
  deleteProduct: (id: number) => request<void>(`/products/admin/${id}`, { method: 'DELETE' }),
  bulkProducts: (payload: BulkActionPayload) =>
    request<BulkActionResult>('/products/admin/bulk', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // articles
  listArticles: (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    keyword?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.pageSize) q.set('pageSize', String(params.pageSize));
    if (params?.status) q.set('status', params.status);
    if (params?.keyword) q.set('keyword', params.keyword);
    const s = q.toString();
    return request<Paginated<Article>>(`/articles/admin${s ? '?' + s : ''}`);
  },
  getArticle: (id: number) => request<Article>(`/articles/admin/${id}`),
  createArticle: (data: Partial<Article>) =>
    request<Article>('/articles/admin', { method: 'POST', body: JSON.stringify(data) }),
  updateArticle: (id: number, data: Partial<Article>) =>
    request<Article>(`/articles/admin/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteArticle: (id: number) => request<void>(`/articles/admin/${id}`, { method: 'DELETE' }),
  bulkArticles: (payload: BulkActionPayload) =>
    request<BulkActionResult>('/articles/admin/bulk', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // site config
  getSiteConfig: () => request<SiteConfig>('/site-config/admin'),
  updateSiteConfig: (data: Partial<SiteConfig>) =>
    request<SiteConfig>('/site-config', { method: 'PUT', body: JSON.stringify(data) }),

  // ai seo
  generateSeo: (data: {
    type: 'product' | 'article';
    name: string;
    content?: string;
    tags?: string;
  }) => request<AiSeoResult>('/ai-seo/generate', { method: 'POST', body: JSON.stringify(data) }),

  // users
  listUsers: () => request<User[]>('/users'),
  createUser: (username: string, password: string) =>
    request<User>('/users', { method: 'POST', body: JSON.stringify({ username, password }) }),
  resetPassword: (id: number, password: string) =>
    request<User>(`/users/${id}/password`, { method: 'PUT', body: JSON.stringify({ password }) }),
  deleteUser: (id: number) => request<void>(`/users/${id}`, { method: 'DELETE' }),

  // upload
  upload: async (file: File): Promise<string> => {
    const form = new FormData();
    form.append('file', file);
    const token = csrfToken();
    const res = await fetch(`${BASE}/uploads`, {
      method: 'POST',
      credentials: 'include',
      headers: token ? { 'X-CSRF-Token': token } : undefined,
      body: form,
    });
    const body = await res.json();
    if (body.code !== 0) throw new Error(body.message || '上传失败');
    return body.data.url;
  },

  // submissions
  listSubmissions: (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    keyword?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.pageSize) q.set('pageSize', String(params.pageSize));
    if (params?.status) q.set('status', params.status);
    if (params?.keyword) q.set('keyword', params.keyword);
    const s = q.toString();
    return request<Paginated<ProjectSubmission>>(`/submissions/admin${s ? '?' + s : ''}`);
  },
  reviewSubmission: (id: number, status: 'approved' | 'rejected', note?: string) =>
    request<ProjectSubmission>(`/submissions/admin/${id}/review`, {
      method: 'PUT',
      body: JSON.stringify({ status, note }),
    }),
  approveAndCreateSubmission: (id: number) =>
    request<ApproveAndCreateResult>(`/submissions/admin/${id}/approve-and-create`, {
      method: 'POST',
    }),
  deleteSubmission: (id: number) => request<void>(`/submissions/admin/${id}`, { method: 'DELETE' }),

  // stats & audit
  getDashboardStats: () => request<DashboardStats>('/stats/dashboard'),
  listAuditLog: (params?: { page?: number; pageSize?: number }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.pageSize) q.set('pageSize', String(params.pageSize));
    const s = q.toString();
    return request<Paginated<AuditLogEntry>>(`/audit-log${s ? '?' + s : ''}`);
  },

  // members（团队成员）
  listMembers: () => request<Member[]>('/members/admin'),
  getMember: (id: number) => request<Member>(`/members/admin/${id}`),
  createMember: (data: Partial<Member>) =>
    request<Member>('/members/admin', { method: 'POST', body: JSON.stringify(data) }),
  updateMember: (id: number, data: Partial<Member>) =>
    request<Member>(`/members/admin/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMember: (id: number) => request<void>(`/members/admin/${id}`, { method: 'DELETE' }),

  // revisions（修订历史）
  listRevisions: (type: 'product' | 'article', id: number) =>
    request<Revision[]>(`/revisions/${type}/${id}`),
  rollbackRevision: (rid: number) =>
    request<Revision>(`/revisions/item/${rid}/rollback`, { method: 'POST' }),

  // media（媒体库）
  listMedia: () => request<Media[]>('/media'),
  deleteMedia: (id: number) => request<void>(`/media/${id}`, { method: 'DELETE' }),

  // topics（专题）
  listTopics: () => request<Topic[]>('/topics/admin'),
  getTopic: (id: number) => request<Topic>(`/topics/admin/${id}`),
  createTopic: (data: Partial<Topic> & { productIds?: number[] }) =>
    request<Topic>('/topics/admin', { method: 'POST', body: JSON.stringify(data) }),
  updateTopic: (id: number, data: Partial<Topic> & { productIds?: number[] }) =>
    request<Topic>(`/topics/admin/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTopic: (id: number) => request<void>(`/topics/admin/${id}`, { method: 'DELETE' }),

  // subscribers（Newsletter）
  listSubscribers: () => request<Subscriber[]>('/subscribers'),
  broadcastSubscribers: (subject: string, html: string) =>
    request<{ sent: number }>('/subscribers/broadcast', {
      method: 'POST',
      body: JSON.stringify({ subject, html }),
    }),

  // backup（备份）
  exportBackup: async (): Promise<Blob> => {
    const token = csrfToken();
    const res = await fetch(`${BASE}/backup/export`, {
      credentials: 'include',
      headers: token ? { 'X-CSRF-Token': token } : undefined,
    });
    return res.blob();
  },
  importBackup: (payload: BackupPayload) =>
    request<{ products: number; articles: number; members: number; topics: number }>(
      '/backup/import',
      { method: 'POST', body: JSON.stringify(payload) },
    ),

  // translations（多语言翻译）
  listTranslations: (type: 'product' | 'article', id: number) =>
    request<{ locale: string; fields: Record<string, string> }[]>(`/translations/${type}/${id}`),
  saveTranslation: (
    type: 'product' | 'article',
    id: number,
    locale: string,
    fields: Record<string, string>,
  ) =>
    request<void>(`/translations/${type}/${id}/${locale}`, {
      method: 'POST',
      body: JSON.stringify(fields),
    }),
  deleteTranslation: (type: 'product' | 'article', id: number, locale: string) =>
    request<void>(`/translations/${type}/${id}/${locale}`, { method: 'DELETE' }),
};
