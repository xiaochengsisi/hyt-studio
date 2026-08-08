<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api } from '../api/client';
import type { SiteConfig } from '@hyt/shared';

const site = ref<SiteConfig | null>(null);

onMounted(async () => {
  try {
    site.value = await api.getSiteConfig();
  } catch {
    /* ignore */
  }
});

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  desc: string;
  auth: 'public' | 'admin';
}

const groups: { name: string; endpoints: Endpoint[] }[] = [
  {
    name: '产品',
    endpoints: [
      { method: 'GET', path: '/api/products', desc: '已发布产品列表（支持分页 / 筛选 / 排序）', auth: 'public' },
      { method: 'GET', path: '/api/products/slug/:slug', desc: '产品详情（按 slug 查询，自动累加浏览量，支持 ?lang= 或 Accept-Language 多语言）', auth: 'public' },
      { method: 'GET', path: '/api/products/slug/:slug/related', desc: '相关项目（按标签重合度）', auth: 'public' },
      { method: 'GET', path: '/api/products/slug/:slug/health', desc: '项目健康度徽章', auth: 'public' },
      { method: 'POST', path: '/api/products/slug/:slug/like', desc: '匿名点赞 / 取消点赞（按 anonId 去重）', auth: 'public' },
      { method: 'GET', path: '/api/products/tags', desc: '已发布产品全部标签（按频次降序）', auth: 'public' },
      { method: 'GET', path: '/api/products/languages', desc: '已发布产品全部语言（按频次降序）', auth: 'public' },
      { method: 'GET', path: '/api/products/hot', desc: '热门产品（综合浏览 + 点赞 + star）', auth: 'public' },
      { method: 'GET', path: '/api/og/product/:slug.png', desc: '产品分享卡片图（PNG）', auth: 'public' },
    ],
  },
  {
    name: '文章',
    endpoints: [
      { method: 'GET', path: '/api/articles', desc: '已发布文章列表', auth: 'public' },
      { method: 'GET', path: '/api/articles/slug/:slug', desc: '文章详情（按 slug 查询，支持 ?lang= 或 Accept-Language 多语言）', auth: 'public' },
    ],
  },
  {
    name: '专题',
    endpoints: [
      { method: 'GET', path: '/api/topics', desc: '全部专题列表', auth: 'public' },
      { method: 'GET', path: '/api/topics/slug/:slug', desc: '专题详情（含关联产品）', auth: 'public' },
    ],
  },
  {
    name: '统计 / 团队 / 提交',
    endpoints: [
      { method: 'GET', path: '/api/stats/public', desc: '公开统计（产品 / 文章 / star / 浏览汇总）', auth: 'public' },
      { method: 'GET', path: '/api/stats/activity?limit=8', desc: '首页活动流（最近产品 / 文章 / 版本）', auth: 'public' },
      { method: 'GET', path: '/api/members', desc: '团队成员列表', auth: 'public' },
      { method: 'POST', path: '/api/submissions', desc: '提交项目收录申请（限流 5/min）', auth: 'public' },
      { method: 'POST', path: '/api/subscribers/subscribe', desc: 'Newsletter 订阅（发送确认邮件）', auth: 'public' },
      { method: 'GET', path: '/api/subscribers/confirm?token=xxx', desc: '确认订阅（邮件链接回跳）', auth: 'public' },
    ],
  },
  {
    name: '站点',
    endpoints: [
      { method: 'GET', path: '/api/site-config', desc: '站点公开配置（不含 AI Key / SMTP 密码）', auth: 'public' },
      { method: 'GET', path: '/api/health', desc: '健康检查', auth: 'public' },
    ],
  },
  {
    name: '多语言翻译（admin）',
    endpoints: [
      { method: 'GET', path: '/api/translations/:type/:id', desc: '列出某产品/文章的全部翻译', auth: 'admin' },
      { method: 'POST', path: '/api/translations/:type/:id/:locale', desc: '保存某语言翻译（upsert）', auth: 'admin' },
      { method: 'DELETE', path: '/api/translations/:type/:id/:locale', desc: '删除某语言翻译', auth: 'admin' },
    ],
  },
];

const methodColor: Record<string, string> = {
  GET: 'm-get',
  POST: 'm-post',
  PUT: 'm-put',
  DELETE: 'm-delete',
};

function tryApi(path: string) {
  window.open(path, '_blank');
}
</script>

<template>
  <div class="page">
    <section class="container section">
      <div class="section-head">
        <span class="eyebrow">API</span>
        <h1 class="title">公开 API 文档</h1>
        <p class="subtitle">
          所有 <code>GET</code> 接口为只读公开访问，可直接用于二次开发与集成。
          <span v-if="site?.siteUrl">{{ site.siteUrl.replace(/\/+$/, '') }}</span>
        </p>
      </div>

      <div class="card tip">
        <strong>使用提示</strong>
        <ul>
          <li>所有接口返回统一 JSON 格式：<code>{ "code": 0, "data": ... }</code>，code 非 0 表示错误。</li>
          <li>列表接口支持 <code>page</code> / <code>pageSize</code> 分页参数。</li>
          <li>写操作（POST/PUT/DELETE）需管理员 JWT 鉴权，公开 API 不开放写权限。</li>
          <li>开发环境可访问 <code>/api/docs</code> 查看完整 Swagger 文档（生产环境关闭）。</li>
        </ul>
      </div>

      <div v-for="g in groups" :key="g.name" class="endpoint-group">
        <h2 class="group-title">{{ g.name }}</h2>
        <div class="endpoint-list">
          <div
            v-for="ep in g.endpoints"
            :key="ep.path + ep.method"
            class="endpoint-row"
            @click="ep.method === 'GET' && tryApi(ep.path)"
          >
            <span class="method" :class="methodColor[ep.method]">{{ ep.method }}</span>
            <code class="path">{{ ep.path }}</code>
            <span class="desc">{{ ep.desc }}</span>
            <span class="auth" :class="ep.auth">{{ ep.auth }}</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.section {
  flex: 1;
  padding: 56px 24px 80px;
  max-width: 960px;
}

.section-head {
  margin-bottom: 32px;
}

.eyebrow {
  display: inline-block;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 10px;
}

.title {
  font-size: 36px;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0 0 12px;
}

.subtitle {
  color: var(--text-muted);
  font-size: 15px;
  margin: 0;
}

.subtitle code {
  background: var(--bg-soft);
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 13px;
}

.tip {
  padding: 18px 22px;
  margin-bottom: 32px;
  background: var(--bg-soft);
}

.tip strong {
  font-size: 14px;
}

.tip ul {
  margin: 8px 0 0;
  padding-left: 18px;
  color: var(--text-muted);
  font-size: 13.5px;
  line-height: 1.8;
}

.tip code {
  background: var(--card);
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 12px;
}

.endpoint-group {
  margin-bottom: 28px;
}

.group-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}

.endpoint-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.endpoint-row {
  display: grid;
  grid-template-columns: 64px minmax(220px, 1.4fr) 2fr 70px;
  align-items: center;
  gap: 14px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  cursor: pointer;
  transition: background 0.14s ease;
}

.endpoint-row:hover {
  background: var(--bg-soft);
}

.method {
  display: inline-block;
  text-align: center;
  padding: 3px 0;
  border-radius: 4px;
  font-family: var(--mono);
  font-size: 10.5px;
  font-weight: 700;
  color: #fff;
}

.m-get {
  background: #0a7d50;
}

.m-post {
  background: #1d4ed8;
}

.m-put {
  background: #b45309;
}

.m-delete {
  background: #b91c1c;
}

.path {
  font-family: var(--mono);
  font-size: 12.5px;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.desc {
  color: var(--text-muted);
  font-size: 12.5px;
}

.auth {
  font-size: 10.5px;
  text-align: center;
  padding: 2px 6px;
  border-radius: 999px;
  font-family: var(--mono);
  text-transform: uppercase;
}

.auth.public {
  background: rgba(16, 185, 129, 0.1);
  color: #047857;
}

.auth.admin {
  background: rgba(245, 158, 11, 0.12);
  color: #b45309;
}

@media (max-width: 720px) {
  .endpoint-row {
    grid-template-columns: 60px 1fr;
    grid-template-rows: auto auto;
    gap: 6px 10px;
  }
  .desc,
  .auth {
    grid-column: 2;
  }
}
</style>
