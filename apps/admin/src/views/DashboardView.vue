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

function shortUrl(u?: string) {
  return u ? u.replace(/^https?:\/\//, '') : '';
}

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
</script>

<template>
  <div>
    <h1 class="page-title">仪表盘</h1>

    <div v-if="loading" class="empty">loading…</div>

    <template v-else-if="stats">
      <!-- 统计卡片 -->
      <div class="stats">
        <div class="card stat">
          <div class="stat-num">{{ stats.products.total }}</div>
          <div class="stat-label">产品总数</div>
          <div class="stat-sub">已发布 {{ stats.products.published }}</div>
        </div>
        <div class="card stat">
          <div class="stat-num">{{ stats.articles.total }}</div>
          <div class="stat-label">文章总数</div>
          <div class="stat-sub">已发布 {{ stats.articles.published }}</div>
        </div>
        <button class="card stat stat-link" @click="router.push('/submissions')">
          <div class="stat-num">{{ stats.submissions.pending }}</div>
          <div class="stat-label">待审核提交</div>
          <div class="stat-sub">共 {{ stats.submissions.total }} 条 →</div>
        </button>
      </div>

      <div class="grid-2">
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

        <!-- 最近活动（审计日志） -->
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
      </div>
    </template>
  </div>
</template>

<style scoped>
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat {
  padding: 20px;
}

.stat-num {
  font-size: 32px;
  font-weight: 800;
  color: var(--primary);
}

.stat-label {
  color: var(--text-muted);
  margin-top: 4px;
  font-size: 14px;
}

.stat-sub {
  color: var(--text-faint);
  font-size: 12px;
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

.muted {
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
