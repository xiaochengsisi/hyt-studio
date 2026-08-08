<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { adminApi } from '../api/client';
import type { Media } from '@hyt/shared';

const list = ref<Media[]>([]);
const loading = ref(false);
const error = ref('');
const success = ref('');
const uploading = ref(false);
const previewUrl = ref<string | null>(null);

async function load() {
  loading.value = true;
  error.value = '';
  try {
    list.value = await adminApi.listMedia();
  } catch (e: any) {
    error.value = e.message || '加载失败';
  } finally {
    loading.value = false;
  }
}

onMounted(load);

async function onUpload(e: Event) {
  const input = e.target as HTMLInputElement;
  if (!input.files?.length) return;
  uploading.value = true;
  error.value = '';
  success.value = '';
  try {
    for (const file of Array.from(input.files)) {
      await adminApi.upload(file);
    }
    success.value = `已上传 ${input.files.length} 个文件`;
    input.value = '';
    await load();
  } catch (err: any) {
    error.value = err.message || '上传失败';
  } finally {
    uploading.value = false;
  }
}

async function onDelete(m: Media) {
  if (!confirm(`确定删除「${m.filename}」？关联地址将失效。`)) return;
  try {
    await adminApi.deleteMedia(m.id);
    await load();
  } catch (e: any) {
    error.value = e.message || '删除失败';
  }
}

function copyUrl(url: string) {
  navigator.clipboard.writeText(url);
  success.value = '已复制链接';
}

function fmtSize(n?: number) {
  if (!n) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function isImg(mimetype?: string) {
  return mimetype?.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg|ico)$/i.test(mimetype || '');
}
</script>

<template>
  <div>
    <div class="page-head">
      <h1 class="page-title">媒体库</h1>
      <label class="button button-primary" :class="{ disabled: uploading }">
        <input type="file" multiple accept="image/*" @change="onUpload" :disabled="uploading" hidden />
        {{ uploading ? '上传中…' : '+ 上传图片' }}
      </label>
    </div>

    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <div v-if="success" class="alert alert-success">{{ success }}</div>

    <div v-if="loading" class="muted">加载中…</div>
    <div v-else-if="!list.length" class="card empty">
      <p class="muted">暂无文件。上传的图片会集中在此管理，可删除以释放存储。</p>
    </div>
    <div v-else class="media-grid">
      <div v-for="m in list" :key="m.id" class="media-card">
        <div class="thumb" @click="previewUrl = m.url">
          <img v-if="isImg(m.mimetype)" :src="m.url" :alt="m.filename" loading="lazy" />
          <div v-else class="file-icon">📄</div>
        </div>
        <div class="media-info">
          <div class="media-name" :title="m.filename">{{ m.filename }}</div>
          <div class="media-meta muted">{{ fmtSize(m.size) }} · {{ new Date(m.createdAt).toLocaleDateString() }}</div>
          <div class="media-actions">
            <button class="link-btn" @click="copyUrl(m.url)">复制链接</button>
            <button class="link-btn danger" @click="onDelete(m)">删除</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="previewUrl" class="modal-mask" @click="previewUrl = null">
      <img :src="previewUrl" class="preview-img" />
    </div>
  </div>
</template>

<style scoped>
.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 14px;
}

.media-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.thumb {
  height: 140px;
  background: var(--bg-soft);
  display: grid;
  place-items: center;
  cursor: zoom-in;
  overflow: hidden;
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-icon {
  font-size: 32px;
}

.media-info {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.media-name {
  font-size: 12.5px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.media-meta {
  font-size: 11px;
}

.media-actions {
  display: flex;
  gap: 12px;
  margin-top: 4px;
}

.link-btn {
  background: none;
  border: 0;
  color: var(--ink);
  font-size: 12px;
  cursor: pointer;
  padding: 0;
}

.link-btn.danger {
  color: #ef4444;
}

.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: grid;
  place-items: center;
  z-index: 100;
  padding: 40px;
  cursor: zoom-out;
}

.preview-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.disabled {
  opacity: 0.6;
  pointer-events: none;
}

.empty {
  padding: 40px;
  text-align: center;
}

.muted {
  color: var(--text-muted);
}
</style>
