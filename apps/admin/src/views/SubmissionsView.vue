<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { adminApi } from '../api/client';
import type { ProjectSubmission } from '@hyt/shared';

const router = useRouter();

const items = ref<ProjectSubmission[]>([]);
const loading = ref(true);
const error = ref('');
const success = ref('');

const keyword = ref('');
const statusFilter = ref('all');
const page = ref(1);
const pageSize = 10;
const total = ref(0);

const reviewTarget = ref<ProjectSubmission | null>(null);
const reviewNote = ref('');

async function load() {
  loading.value = true;
  try {
    const res = await adminApi.listSubmissions({
      keyword: keyword.value || undefined,
      status: statusFilter.value === 'all' ? undefined : statusFilter.value,
      page: page.value,
      pageSize,
    });
    items.value = res.items;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  page.value = 1;
  load();
}

function onPage(p: number) {
  if (p < 1 || p > totalPages()) return;
  page.value = p;
  load();
}

const totalPages = () => Math.max(1, Math.ceil(total.value / pageSize));

onMounted(load);

function openReview(s: ProjectSubmission) {
  reviewTarget.value = s;
  reviewNote.value = s.reviewNote || '';
}

async function onReview(status: 'approved' | 'rejected') {
  if (!reviewTarget.value) return;
  error.value = '';
  success.value = '';
  try {
    await adminApi.reviewSubmission(reviewTarget.value.id, status, reviewNote.value || undefined);
    success.value = status === 'approved' ? '已通过审核' : '已驳回';
    reviewTarget.value = null;
    await load();
  } catch (e: any) {
    error.value = e.message || '操作失败';
  }
}

async function onDelete(s: ProjectSubmission) {
  if (!confirm(`确定删除提交「${s.name}」？`)) return;
  try {
    await adminApi.deleteSubmission(s.id);
    await load();
  } catch (e: any) {
    error.value = e.message || '删除失败';
  }
}

async function onApproveAndCreate(s: ProjectSubmission) {
  if (!confirm(`通过「${s.name}」并创建为产品草稿？创建后可在产品编辑页继续完善。`)) return;
  error.value = '';
  success.value = '';
  try {
    const { product } = await adminApi.approveAndCreateSubmission(s.id);
    success.value = `已创建产品草稿「${product.name}」`;
    reviewTarget.value = null;
    await load();
    // 跳转到新产品编辑页，便于继续完善后发布
    router.push({ name: 'product-edit', params: { id: product.id } });
  } catch (e: any) {
    error.value = e.message || '操作失败';
  }
}

const statusBadge = (status: string) =>
  status === 'approved' ? 'badge-published' : status === 'rejected' ? 'badge-rejected' : 'badge-draft';
const statusLabel = (status: string) =>
  status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'pending';
</script>

<template>
  <div>
    <div class="page-head">
      <h1 class="page-title">提交审核</h1>
    </div>

    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <div v-if="success" class="alert alert-success">{{ success }}</div>

    <div class="toolbar">
      <input
        v-model="keyword"
        class="search-input"
        type="search"
        placeholder="搜索项目 / 作者 / 邮箱…"
        @keyup.enter="onSearch"
      />
      <select v-model="statusFilter" class="search-input select" @change="onSearch">
        <option value="all">all</option>
        <option value="pending">pending</option>
        <option value="approved">approved</option>
        <option value="rejected">rejected</option>
      </select>
      <button class="button button-ghost" @click="onSearch">搜索</button>
    </div>

    <div class="card">
      <div v-if="loading" class="empty">loading…</div>
      <table v-else class="table">
        <thead>
          <tr>
            <th>name</th>
            <th>author</th>
            <th>repo</th>
            <th>status</th>
            <th>created</th>
            <th>actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in items" :key="s.id">
            <td>
              {{ s.name }}
              <div v-if="s.tagline" class="muted sub">{{ s.tagline }}</div>
            </td>
            <td class="muted">{{ s.author || '—' }}</td>
            <td class="muted">
              <a v-if="s.repoUrl" :href="s.repoUrl" target="_blank" rel="noopener" class="link">{{ shortUrl(s.repoUrl) }}</a>
              <span v-else>—</span>
            </td>
            <td>
              <span class="badge" :class="statusBadge(s.status)">{{ statusLabel(s.status) }}</span>
            </td>
            <td class="muted">{{ new Date(s.createdAt).toLocaleDateString() }}</td>
            <td>
              <div class="row-actions">
                <button class="button button-ghost" @click="openReview(s)">审核</button>
                <button
                  v-if="s.status !== 'approved'"
                  class="button button-primary"
                  @click="onApproveAndCreate(s)"
                >通过并创建</button>
                <button class="button button-danger" @click="onDelete(s)">删除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!loading && !items.length" class="empty">暂无提交申请。</div>
    </div>

    <div class="pager">
      <span class="pager-info">共 {{ total }} 条 · 第 {{ page }} / {{ totalPages() }} 页</span>
      <div class="pager-btns">
        <button class="button button-ghost" :disabled="page <= 1" @click="onPage(page - 1)">上一页</button>
        <button class="button button-ghost" :disabled="page >= totalPages()" @click="onPage(page + 1)">下一页</button>
      </div>
    </div>

    <div v-if="reviewTarget" class="modal-mask" @click.self="reviewTarget = null">
      <div class="modal">
        <h3 class="card-title">审核提交 · {{ reviewTarget.name }}</h3>
        <p class="muted desc">{{ reviewTarget.description || '（无项目介绍）' }}</p>
        <div v-if="reviewTarget.homepage" class="muted desc">
          主页：<a :href="reviewTarget.homepage" target="_blank" rel="noopener" class="link">{{ shortUrl(reviewTarget.homepage) }}</a>
        </div>
        <div v-if="reviewTarget.email" class="muted desc">联系：{{ reviewTarget.email }}</div>
        <div class="field">
          <label class="label">审核备注</label>
          <textarea v-model="reviewNote" class="input textarea" rows="3" placeholder="可选，用于说明驳回原因等"></textarea>
        </div>
        <div class="modal-actions">
          <button class="button button-primary" @click="onReview('approved')">通过</button>
          <button
            v-if="reviewTarget.status !== 'approved'"
            class="button button-primary"
            @click="onApproveAndCreate(reviewTarget)"
          >通过并创建产品</button>
          <button class="button button-danger" @click="onReview('rejected')">驳回</button>
          <button class="button button-ghost" @click="reviewTarget = null">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
function shortUrl(u?: string) {
  if (!u) return '';
  return u.replace(/^https?:\/\//, '');
}
</script>

<style scoped>
.muted {
  color: var(--text-muted);
}

.sub {
  font-size: 12px;
  margin-top: 2px;
}

.empty {
  padding: 40px;
  text-align: center;
  color: var(--text-muted);
}

.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  max-width: 320px;
  height: 38px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg);
  font-size: 14px;
  outline: none;
}

.select {
  max-width: 140px;
}

.search-input:focus {
  border-color: var(--primary);
}

.link {
  color: var(--primary);
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

.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 22px;
  width: 460px;
  max-width: 90vw;
  box-shadow: var(--shadow);
}

.card-title {
  margin: 0 0 10px;
  font-size: 16px;
}

.desc {
  font-size: 13px;
  line-height: 1.6;
  margin: 0 0 10px;
  word-break: break-all;
}

.field {
  margin-top: 14px;
}

.label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 6px;
}

.input {
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg);
  font-size: 14px;
  outline: none;
}

.textarea {
  resize: vertical;
  font-family: inherit;
}

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 18px;
}
</style>