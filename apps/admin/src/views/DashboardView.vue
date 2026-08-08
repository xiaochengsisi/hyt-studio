<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { adminApi } from '../api/client';
import type { DashboardStats } from '@hyt/shared';

const router = useRouter();
const stats = ref<DashboardStats | null>(null);
const loading = ref(true);

onMounted(async () => {
  try {
    stats.value = await adminApi.getDashboardStats();
  } finally {
    loading.value = false;
  }
});

function actionLabel(a: string) {
  const map: Record<string, string> = {
    create: '创建',
    update: '更新',
    delete: '删除',
    review: '审核',
    login: '登录',
  };
  return map[a] || a;
}

function timeOf(s: string) {
  const d = new Date(s);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function fmt(n: number) {
  if (n >= 10000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

const quickActions = [
  { label: '新建产品', to: '/products/new', icon: '➕' },
  { label: '新建文章', to: '/articles/new', icon: '📝' },
  { label: '新建专题', to: '/topics', icon: '🗂' },
  { label: '审核提交', to: '/submissions', icon: '✅' },
  { label: '站点设置', to: '/settings', icon: '⚙' },
  { label: '数据备份', to: '/backup', icon: '💾' },
];
</script>

<template>
  <div>
    <div class="page-head">
      <h1 class="page-title">仪表盘</h1>
      <span class="muted">站点运营概览</span>
    </div>

    <div v-if="loading" class="empty">加载中…</div>

    <template v-else-if="stats">
      <!-- 内容统计卡片 -->
      <div class="section-label">内容</div>
      <div class="stats">
        <div class="card stat">
          <div class="stat-num">{{ stats.products.total }}</div>
          <div class="stat-label">产品</div>
          <div class="stat-sub">已发布 {{ stats.products.published }}</div>
        </div>
        <div class="card stat">
          <div class="stat-num">{{ stats.articles.total }}</div>
          <div class="stat-label">文章</div>
          <div class="stat-sub">已发布 {{ stats.articles.published }}</div>
        </div>
        <button class="card stat stat-link" @click="router.push('/submissions')">
          <div class="stat-num">{{ stats.submissions.pending }}</div>
          <div class="stat-label">待审核</div>
          <div class="stat-sub">共 {{ stats.submissions.total }} 条 →</div>
        </button>
        <button class="card stat stat-link" @click="router.push('/topics')">
          <div class="stat-num">{{ stats.counts.topics }}</div>
          <div class="stat-label">专题</div>
          <div class="stat-sub">查看 →</div>
        </button>
      </div>

      <!-- 互动汇总 -->
      <div class="section-label">互动</div>
      <div class="stats">
        <div class="card stat">
          <div class="stat-num">{{ fmt(stats.engagement.totalViews) }}</div>
          <div class="stat-label">总浏览量</div>
        </div>
        <div class="card stat">
          <div class="stat-num">{{ fmt(stats.engagement.totalLikes) }}</div>
          <div class="stat-label">总点赞数</div>
        </div>
        <div class="card stat">
          <div class="stat-num">{{ fmt(stats.engagement.totalStars) }}</div>
          <div class="stat-label">GitHub Stars</div>
        </div>
        <button class="card stat stat-link" @click="router.push('/subscribers')">
          <div class="stat-num">{{ stats.counts.subscribers }}</div>
          <div class="stat-label">订阅者</div>
          <div class="stat-sub">查看 →</div>
        </button>
      </div>

      <div class="grid-2">
        <!-- 浏览量 Top 产品 -->
        <div class="card panel">
          <div class="panel-head">
            <h2 class="panel-title">热门产品（浏览量 Top 5）</h2>
            <router-link to="/products" class="link-more">全部 →</router-link>
          </div>
          <div v-if="!stats.topProducts.length" class="empty-sm">暂无数据</div>
          <ul v-else class="mini-list">
            <li v-for="(p, i) in stats.topProducts" :key="p.id">
              <span class="rank">{{ i + 1 }}</span>
              <span class="mini-name" @click="router.push(`/products/${p.id}`)">{{ p.name }}</span>
              <span class="mini-num">👁 {{ p.viewCount }}</span>
              <span class="mini-num">♥ {{ p.likeCount }}</span>
              <span class="mini-num">★ {{ p.githubStars }}</span>
            </li>
          </ul>
        </div>

        <!-- 最近提交 -->
        <div class="card panel">
          <div class="panel-head">
            <h2 class="panel-title">最近提交</h2>
            <router-link to="/submissions" class="link-more">全部 →</router-link>
          </div>
          <div v-if="!stats.recentSubmissions.length" class="empty-sm">暂无提交</div>
          <ul v-else class="mini-list">
            <li v-for="s in stats.recentSubmissions" :key="s.id">
              <div class="mini-main">
                <span class="mini-name">{{ s.name }}</span>
                <span class="muted mini-sub">{{ s.author || '—' }}</span>
              </div>
              <span class="badge" :class="s.status === 'pending' ? 'badge-draft' : s.status === 'approved' ? 'badge-published' : 'badge-rejected'">
                {{ s.status }}
              </span>
              <span class="muted mini-time">{{ timeOf(s.createdAt) }}</span>
            </li>
          </ul>
        </div>

        <!-- 最近活动 -->
        <div class="card panel">
          <div class="panel-head">
            <h2 class="panel-title">最近活动</h2>
            <router-link to="/audit-log" class="link-more">全部 →</router-link>
          </div>
          <div v-if="!stats.recentAudit.length" class="empty-sm">暂无活动</div>
          <ul v-else class="mini-list">
            <li v-for="a in stats.recentAudit" :key="a.id">
              <span class="badge badge-draft">{{ actionLabel(a.action) }}</span>
              <span class="mini-path">{{ a.username || '—' }} · {{ a.path }}</span>
              <span class="muted mini-time">{{ timeOf(a.createdAt) }}</span>
            </li>
          </ul>
        </div>

        <!-- 快捷操作 -->
        <div class="card panel">
          <div class="panel-head">
            <h2 class="panel-title">快捷操作</h2>
            <small class="muted">按 ⌘/Ctrl + K 唤出命令面板</small>
          </div>
          <div class="quick-grid">
            <button
              v-for="qa in quickActions"
              :key="qa.to"
              class="quick-item"
              @click="router.push(qa.to)"
            >
              <span class="quick-icon">{{ qa.icon }}</span>
              <span class="quick-label">{{ qa.label }}</span>
            </button>
          </div>
          <div class="counts-row">
            <span>成员 {{ stats.counts.members }}</span>
            <span>媒体 {{ stats.counts.media }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.page-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
}

.muted {
  color: var(--text-muted);
  font-size: 12px;
}

.section-label {
  font-family: var(--mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-faint);
  margin: 0 0 10px;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
  margin-bottom: 24px;
}

.stat {
  padding: 18px;
}

.stat-num {
  font-size: 28px;
  font-weight: 800;
  color: var(--primary);
  letter-spacing: -0.02em;
}

.stat-label {
  color: var(--text-muted);
  margin-top: 4px;
  font-size: 13px;
}

.stat-sub {
  color: var(--text-faint);
  font-size: 11.5px;
  margin-top: 6px;
}

.stat-link {
  text-align: left;
  cursor: pointer;
  border: 1px solid var(--border);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.stat-link:hover {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-soft, rgba(16, 185, 129, 0.1));
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.panel {
  padding: 18px 20px;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  border-bottom: 1px solid var(--border);
  padding-bottom: 10px;
  gap: 8px;
}

.panel-title {
  font-size: 15px;
  font-weight: 700;
  margin: 0;
}

.link-more {
  font-size: 13px;
  color: var(--primary);
}

.mini-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.mini-list li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 0;
  border-bottom: 1px solid var(--border);
  font-size: 13.5px;
}

.mini-list li:last-child {
  border-bottom: none;
}

.mini-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.mini-name {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}

.mini-name:hover {
  color: var(--primary);
}

.mini-sub {
  font-size: 12px;
}

.mini-path {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
}

.mini-time {
  font-size: 12px;
  flex-shrink: 0;
}

.mini-num {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.rank {
  display: inline-grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background: var(--bg-soft);
  color: var(--text-faint);
  font-family: var(--mono);
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
  margin-bottom: 14px;
}

.quick-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg);
  cursor: pointer;
  font-size: 13px;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.quick-item:hover {
  border-color: var(--primary);
  background: var(--bg-soft);
}

.quick-icon {
  font-size: 14px;
}

.quick-label {
  font-weight: 500;
}

.counts-row {
  display: flex;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
  font-size: 12px;
  color: var(--text-muted);
}

.empty {
  padding: 40px;
  text-align: center;
  color: var(--text-muted);
}

.empty-sm {
  padding: 24px;
  text-align: center;
  color: var(--text-faint);
  font-size: 13px;
}

.badge-rejected {
  border-color: var(--danger, #dc2626);
  color: var(--danger, #dc2626);
  background: rgba(220, 38, 38, 0.08);
}

@media (max-width: 720px) {
  .grid-2 {
    grid-template-columns: 1fr;
  }
}
</style>
