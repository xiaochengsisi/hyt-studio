<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { adminApi } from '../api/client';
import type { AuditLogEntry } from '@hyt/shared';

const items = ref<AuditLogEntry[]>([]);
const loading = ref(true);
const page = ref(1);
const pageSize = 30;
const total = ref(0);

async function load() {
  loading.value = true;
  try {
    const res = await adminApi.listAuditLog({ page: page.value, pageSize });
    items.value = res.items;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
}

const totalPages = () => Math.max(1, Math.ceil(total.value / pageSize));

function onPage(p: number) {
  if (p < 1 || p > totalPages()) return;
  page.value = p;
  load();
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

function actionBadge(a: string) {
  if (a === 'delete') return 'badge-rejected';
  if (a === 'create') return 'badge-published';
  return 'badge-draft';
}

function timeOf(s: string) {
  const d = new Date(s);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function parseDetail(d?: string) {
  if (!d) return '';
  try {
    const obj = JSON.parse(d);
    if (typeof obj === 'string') return obj;
    return Object.entries(obj)
      .map(([k, v]) => `${k}: ${v}`)
      .join('  ·  ');
  } catch {
    return d;
  }
}

onMounted(load);
</script>

<template>
  <div>
    <div class="page-head">
      <h1 class="page-title">审计日志</h1>
      <p class="muted sub">记录管理员的创建 / 更新 / 删除 / 审核等操作。</p>
    </div>

    <div class="card">
      <div v-if="loading" class="empty">loading…</div>
      <table v-else class="table">
        <thead>
          <tr>
            <th>操作</th>
            <th>用户</th>
            <th>路径</th>
            <th>详情</th>
            <th>IP</th>
            <th>时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in items" :key="a.id">
            <td><span class="badge" :class="actionBadge(a.action)">{{ actionLabel(a.action) }}</span></td>
            <td>{{ a.username || '—' }}</td>
            <td class="mono-path">{{ a.method || '' }} {{ a.path }}</td>
            <td class="muted detail-cell">{{ parseDetail(a.detail) || '—' }}</td>
            <td class="muted">{{ a.ip || '—' }}</td>
            <td class="muted">{{ timeOf(a.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
      <div v-if="!loading && !items.length" class="empty">暂无审计记录。</div>
    </div>

    <div class="pager">
      <span class="pager-info">共 {{ total }} 条 · 第 {{ page }} / {{ totalPages() }} 页</span>
      <div class="pager-btns">
        <button class="button button-ghost" :disabled="page <= 1" @click="onPage(page - 1)">上一页</button>
        <button class="button button-ghost" :disabled="page >= totalPages()" @click="onPage(page + 1)">下一页</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.muted {
  color: var(--text-muted);
}

.sub {
  font-size: 13px;
  margin: 4px 0 0;
}

.page-head {
  margin-bottom: 16px;
}

.empty {
  padding: 40px;
  text-align: center;
  color: var(--text-muted);
}

.mono-path {
  font-family: var(--mono);
  font-size: 12.5px;
  white-space: nowrap;
}

.detail-cell {
  font-size: 12.5px;
  max-width: 280px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.badge-rejected {
  border-color: var(--danger, #dc2626);
  color: var(--danger, #dc2626);
  background: rgba(220, 38, 38, 0.08);
}

.pager {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  flex-wrap: wrap;
  gap: 8px;
}

.pager-info {
  color: var(--text-muted);
  font-size: 13px;
}

.pager-btns {
  display: flex;
  gap: 8px;
}
</style>
