<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { adminApi } from '../api/client';
import ImageUploader from '../components/ImageUploader.vue';
import type { Topic, Product } from '@hyt/shared';

const list = ref<Topic[]>([]);
const products = ref<Product[]>([]);
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const success = ref('');
const editingId = ref<number | null>(null);
const showEditor = ref(false);

const form = reactive<Partial<Topic> & { productIds: number[] }>({
  slug: '',
  name: '',
  description: '',
  coverUrl: '',
  sortOrder: 0,
  productIds: [],
});

async function load() {
  loading.value = true;
  try {
    const [topics, productList] = await Promise.all([
      adminApi.listTopics(),
      adminApi.listProducts({ pageSize: 500 }),
    ]);
    list.value = topics;
    products.value = productList.items;
  } catch (e: any) {
    error.value = e.message || '加载失败';
  } finally {
    loading.value = false;
  }
}

onMounted(load);

function resetForm() {
  form.slug = '';
  form.name = '';
  form.description = '';
  form.coverUrl = '';
  form.sortOrder = 0;
  form.productIds = [];
  editingId.value = null;
  showEditor.value = false;
}

function startNew() {
  resetForm();
  showEditor.value = true;
}

async function startEdit(t: Topic) {
  resetForm();
  const detail = await adminApi.getTopic(t.id);
  form.slug = detail.slug;
  form.name = detail.name;
  form.description = detail.description || '';
  form.coverUrl = detail.coverUrl || '';
  form.sortOrder = detail.sortOrder;
  form.productIds = (detail.products || []).map((p) => p.id);
  editingId.value = t.id;
  showEditor.value = true;
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}\-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function onNameInput() {
  if (!editingId.value) form.slug = slugify(form.name || '');
}

async function onSave() {
  error.value = '';
  success.value = '';
  if (!form.name || !form.slug) {
    error.value = '名称和 Slug 必填';
    return;
  }
  saving.value = true;
  try {
    const payload = { ...form };
    if (editingId.value) {
      await adminApi.updateTopic(editingId.value, payload);
      success.value = '已更新';
    } else {
      await adminApi.createTopic(payload);
      success.value = '已创建';
    }
    resetForm();
    await load();
  } catch (e: any) {
    error.value = e.message || '保存失败';
  } finally {
    saving.value = false;
  }
}

async function onDelete(t: Topic) {
  if (!confirm(`确定删除专题「${t.name}」？该操作可恢复（软删除）。`)) return;
  try {
    await adminApi.deleteTopic(t.id);
    await load();
  } catch (e: any) {
    error.value = e.message || '删除失败';
  }
}

function toggleProduct(pid: number) {
  const i = form.productIds.indexOf(pid);
  if (i >= 0) form.productIds.splice(i, 1);
  else form.productIds.push(pid);
}
</script>

<template>
  <div>
    <div class="page-head">
      <h1 class="page-title">专题（策展集合）</h1>
      <button class="button button-primary" @click="startNew">+ 新建专题</button>
    </div>

    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <div v-if="success" class="alert alert-success">{{ success }}</div>

    <div v-if="loading" class="muted">加载中…</div>
    <div v-else-if="!list.length" class="card empty">
      <p class="muted">暂无专题。新建第一个专题，将相关产品聚合到一个落地页。</p>
    </div>
    <div v-else class="topic-grid">
      <div v-for="t in list" :key="t.id" class="card topic-card">
        <div class="cover" :style="t.coverUrl ? `background-image:url(${t.coverUrl})` : ''"></div>
        <div class="topic-body">
          <div class="topic-head">
            <h3>{{ t.name }}</h3>
            <span class="badge">/ {{ t.slug }}</span>
          </div>
          <p class="muted desc">{{ t.description || '—' }}</p>
          <div class="topic-meta">
            <span>排序 {{ t.sortOrder }}</span>
            <span>{{ new Date(t.updatedAt).toLocaleDateString() }}</span>
          </div>
          <div class="topic-actions">
            <button class="button button-ghost" @click="startEdit(t)">编辑</button>
            <button class="button button-ghost danger" @click="onDelete(t)">删除</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showEditor" class="modal-mask" @click.self="resetForm">
      <form class="card modal-card" @submit.prevent="onSave">
        <h2 class="modal-title">{{ editingId ? '编辑专题' : '新建专题' }}</h2>

        <div class="field">
          <label class="label">名称 *</label>
          <input class="input" v-model="form.name" required @input="onNameInput" />
        </div>
        <div class="field">
          <label class="label">Slug *</label>
          <input class="input" v-model="form.slug" required />
        </div>
        <div class="field">
          <label class="label">描述</label>
          <textarea class="textarea" v-model="form.description"></textarea>
        </div>
        <div class="field">
          <label class="label">封面图</label>
          <ImageUploader v-model="form.coverUrl" />
        </div>
        <div class="field">
          <label class="label">排序值（越小越靠前）</label>
          <input class="input" type="number" v-model.number="form.sortOrder" style="max-width: 160px" />
        </div>

        <div class="field">
          <label class="label">关联产品（已选 {{ form.productIds.length }} 个）</label>
          <div class="product-pick">
            <label
              v-for="p in products"
              :key="p.id"
              class="pick-item"
              :class="{ active: form.productIds.includes(p.id) }"
            >
              <input type="checkbox" :checked="form.productIds.includes(p.id)" @change="toggleProduct(p.id)" />
              <span class="pick-name">{{ p.name }}</span>
              <span class="pick-tag muted">{{ p.status }}</span>
            </label>
          </div>
        </div>

        <div class="btn-row">
          <button class="button button-primary" type="submit" :disabled="saving">
            {{ saving ? '保存中…' : '保存' }}
          </button>
          <button class="button button-ghost" type="button" @click="resetForm">取消</button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.topic-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.topic-card {
  padding: 0;
  overflow: hidden;
}

.cover {
  height: 140px;
  background: var(--bg-soft);
  background-size: cover;
  background-position: center;
  border-bottom: 1px solid var(--border);
}

.topic-body {
  padding: 16px;
}

.topic-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.topic-head h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
}

.badge {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--text-faint);
}

.desc {
  font-size: 13px;
  min-height: 36px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.topic-meta {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-faint);
  margin: 10px 0;
}

.topic-actions {
  display: flex;
  gap: 8px;
}

.topic-actions .button {
  flex: 1;
  font-size: 12px;
  padding: 6px 10px;
}

.danger {
  color: #ef4444;
}

.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 40px 16px;
  z-index: 100;
  overflow-y: auto;
}

.modal-card {
  width: 100%;
  max-width: 640px;
  padding: 24px;
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 16px;
}

.product-pick {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 6px;
  max-height: 240px;
  overflow-y: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 10px;
}

.pick-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 13px;
}

.pick-item.active {
  background: var(--bg-soft);
}

.pick-name {
  flex: 1;
}

.pick-tag {
  font-family: var(--mono);
  font-size: 10px;
  text-transform: uppercase;
}

.btn-row {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.empty {
  padding: 40px;
  text-align: center;
}

.muted {
  color: var(--text-muted);
  font-size: 12px;
}
</style>
