<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { adminApi } from '../api/client';
import type { Product } from '@hyt/shared';

const router = useRouter();
const products = ref<Product[]>([]);
const loading = ref(true);
const keyword = ref('');
const page = ref(1);
const pageSize = 10;
const total = ref(0);
const selected = ref<Set<number>>(new Set());
const bulkBusy = ref(false);

async function load() {
  loading.value = true;
  try {
    const res = await adminApi.listProducts({ keyword: keyword.value || undefined, page: page.value, pageSize });
    products.value = res.items;
    total.value = res.total;
    selected.value = new Set();
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

async function onDelete(p: Product) {
  if (!confirm(`确定删除产品「${p.name}」？`)) return;
  await adminApi.deleteProduct(p.id);
  await load();
}

function toggleSelect(id: number) {
  const next = new Set(selected.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  selected.value = next;
}

function toggleSelectAll() {
  if (selected.value.size === products.value.length) {
    selected.value = new Set();
  } else {
    selected.value = new Set(products.value.map((p) => p.id));
  }
}

const allSelected = () => products.value.length > 0 && selected.value.size === products.value.length;

async function onBulk(action: 'publish' | 'draft' | 'archive' | 'delete') {
  const ids = [...selected.value];
  if (!ids.length) return;
  const label = action === 'publish' ? '发布' : action === 'draft' ? '转为草稿' : action === 'archive' ? '归档' : '删除';
  if (!confirm(`确定对选中的 ${ids.length} 项执行「${label}」？`)) return;
  bulkBusy.value = true;
  try {
    await adminApi.bulkProducts({ ids, action });
    await load();
  } catch (e: any) {
    alert(e.message || '操作失败');
  } finally {
    bulkBusy.value = false;
  }
}
</script>

<template>
  <div>
    <div class="page-head">
      <h1 class="page-title">产品管理</h1>
      <router-link to="/products/new" class="button button-primary">+ 新建</router-link>
    </div>

    <div class="toolbar">
      <input
        v-model="keyword"
        class="search-input"
        type="search"
        placeholder="搜索名称 / slug / 标签…"
        @keyup.enter="onSearch"
      />
      <button class="button button-ghost" @click="onSearch">搜索</button>
    </div>

    <div v-if="selected.size" class="bulk-bar">
      <span class="bulk-info">已选 {{ selected.size }} 项</span>
      <div class="bulk-actions">
        <button class="button button-ghost" :disabled="bulkBusy" @click="onBulk('publish')">发布</button>
        <button class="button button-ghost" :disabled="bulkBusy" @click="onBulk('draft')">转草稿</button>
        <button class="button button-ghost" :disabled="bulkBusy" @click="onBulk('archive')">归档</button>
        <button class="button button-danger" :disabled="bulkBusy" @click="onBulk('delete')">删除</button>
      </div>
    </div>

    <div class="card">
      <div v-if="loading" class="empty">loading…</div>
      <table v-else class="table">
        <thead>
          <tr>
            <th class="col-check">
              <input type="checkbox" :checked="allSelected()" @change="toggleSelectAll" />
            </th>
            <th>name</th>
            <th>slug</th>
            <th>status</th>
            <th>featured</th>
            <th>version</th>
            <th>actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in products" :key="p.id" :class="{ rowSelected: selected.has(p.id) }">
            <td class="col-check">
              <input type="checkbox" :checked="selected.has(p.id)" @change="toggleSelect(p.id)" />
            </td>
            <td>{{ p.name }}</td>
            <td class="muted">{{ p.slug }}</td>
            <td>
              <span class="badge" :class="p.status === 'published' ? 'badge-published' : 'badge-draft'">
                {{ p.status === 'published' ? 'published' : p.status === 'draft' ? 'draft' : 'archived' }}
              </span>
            </td>
            <td>
              <span v-if="p.featured" class="badge badge-featured">★</span>
              <span v-else class="muted">—</span>
            </td>
            <td class="muted">{{ p.version || '—' }}</td>
            <td>
              <div class="row-actions">
                <button class="button button-ghost" @click="router.push(`/products/${p.id}`)">编辑</button>
                <button class="button button-danger" @click="onDelete(p)">删除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!loading && !products.length" class="empty">暂无产品，点击右上角「+ 新建」创建。</div>
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

.empty {
  padding: 40px;
  text-align: center;
  color: var(--text-muted);
}

.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
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

.search-input:focus {
  border-color: var(--primary);
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