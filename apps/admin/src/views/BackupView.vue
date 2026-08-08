<script setup lang="ts">
import { ref } from 'vue';
import { adminApi } from '../api/client';
import type { BackupPayload } from '@hyt/shared';

const error = ref('');
const success = ref('');
const exporting = ref(false);
const importing = ref(false);
const importResult = ref<{ products: number; articles: number; members: number; topics: number } | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

async function onExport() {
  exporting.value = true;
  error.value = '';
  success.value = '';
  try {
    const blob = await adminApi.exportBackup();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hyt-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    success.value = '已导出备份文件';
  } catch (e: any) {
    error.value = e.message || '导出失败';
  } finally {
    exporting.value = false;
  }
}

function onPickFile() {
  fileInput.value?.click();
}

async function onImport(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  if (!confirm('导入将以合并模式写入（相同 slug 跳过），且会覆盖站点配置。确定继续？')) {
    input.value = '';
    return;
  }
  importing.value = true;
  error.value = '';
  success.value = '';
  importResult.value = null;
  try {
    const text = await file.text();
    const payload = JSON.parse(text) as BackupPayload;
    const r = await adminApi.importBackup(payload);
    importResult.value = r;
    success.value = `导入完成：产品 ${r.products} / 文章 ${r.articles} / 成员 ${r.members} / 专题 ${r.topics}`;
  } catch (err: any) {
    error.value = err.message || '导入失败（文件格式可能不正确）';
  } finally {
    importing.value = false;
    input.value = '';
  }
}
</script>

<template>
  <div>
    <div class="page-head">
      <h1 class="page-title">数据备份</h1>
    </div>

    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <div v-if="success" class="alert alert-success">{{ success }}</div>

    <div class="grid-2">
      <div class="card">
        <h3 class="card-title">导出全站数据</h3>
        <p class="muted">将站点配置、产品、文章、团队成员、专题一次性导出为 JSON 文件。建议定期导出存档。</p>
        <button class="button button-primary" :disabled="exporting" @click="onExport">
          {{ exporting ? '导出中…' : '⬇ 导出 JSON' }}
        </button>
      </div>

      <div class="card">
        <h3 class="card-title">导入备份</h3>
        <p class="muted">上传此前导出的 JSON 文件，按合并模式写入（相同 slug 跳过，不删除现有数据）。</p>
        <input ref="fileInput" type="file" accept="application/json,.json" hidden @change="onImport" />
        <button class="button button-ghost" :disabled="importing" @click="onPickFile">
          {{ importing ? '导入中…' : '⬆ 选择文件导入' }}
        </button>
        <div v-if="importResult" class="result-box">
          <div>产品：{{ importResult.products }}</div>
          <div>文章：{{ importResult.articles }}</div>
          <div>成员：{{ importResult.members }}</div>
          <div>专题：{{ importResult.topics }}</div>
        </div>
      </div>
    </div>

    <div class="card tip">
      <h4 class="tip-title">说明</h4>
      <ul class="tip-list">
        <li>导出文件包含站点全部内容，请妥善保管，避免泄露。</li>
        <li>导入采用「合并模式」：相同 slug 的内容会跳过，不会覆盖；站点配置会直接覆盖。</li>
        <li>媒体文件（图片等）不在备份范围内，需另行保存 <code>uploads/</code> 目录。</li>
        <li>生产环境可结合 cron + <code>GET /api/backup/export</code> 实现定时备份。</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.grid-2 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 8px;
}

.result-box {
  margin-top: 12px;
  padding: 12px;
  background: var(--bg-soft);
  border-radius: var(--radius-sm);
  font-family: var(--mono);
  font-size: 12px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
}

.tip {
  background: var(--bg-soft);
}

.tip-title {
  font-size: 13px;
  font-weight: 700;
  margin: 0 0 8px;
}

.tip-list {
  margin: 0;
  padding-left: 18px;
  color: var(--text-muted);
  font-size: 12.5px;
  line-height: 1.7;
}

.tip-list code {
  background: var(--card);
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 11.5px;
}

.muted {
  color: var(--text-muted);
  font-size: 12.5px;
  margin: 0 0 12px;
}
</style>
