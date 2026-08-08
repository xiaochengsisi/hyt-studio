<script setup lang="ts">
import { ref, watch } from 'vue';
import { adminApi } from '../api/client';
import type { Revision } from '@hyt/shared';

const props = defineProps<{ type: 'product' | 'article'; entityId: number | null }>();

const list = ref<Revision[]>([]);
const loading = ref(false);
const busy = ref(false);
const expanded = ref<number | null>(null);

async function load() {
  if (!props.entityId) {
    list.value = [];
    return;
  }
  loading.value = true;
  try {
    list.value = await adminApi.listRevisions(props.type, props.entityId);
  } finally {
    loading.value = false;
  }
}

watch(() => props.entityId, load, { immediate: true });

async function onRollback(r: Revision) {
  if (!confirm(`确定回滚到该修订（${r.createdAt}）？当前内容将被覆盖，且自动留档一份。`)) return;
  busy.value = true;
  try {
    await adminApi.rollbackRevision(r.id);
    alert('已回滚，请刷新页面查看恢复后的内容');
    await load();
  } catch (e: any) {
    alert(e.message || '回滚失败');
  } finally {
    busy.value = false;
  }
}

function toggle(id: number) {
  expanded.value = expanded.value === id ? null : id;
}

function fmt(s: string): string {
  const d = new Date(s);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function preview(r: Revision): string {
  const s = r.snapshot || {};
  return s.name || s.title || `#${r.entityId}`;
}
</script>

<template>
  <div class="rev-panel">
    <h3 class="rev-title">修订历史</h3>
    <small class="muted">每次保存自动留档，可一键回滚（回滚后当前状态也会留档）。</small>

    <div v-if="loading" class="muted" style="margin-top: 12px">加载中…</div>
    <div v-else-if="!list.length" class="muted" style="margin-top: 12px">暂无历史记录。</div>
    <ul v-else class="rev-list">
      <li v-for="r in list" :key="r.id" class="rev-item">
        <div class="rev-row">
          <button class="rev-expand" @click="toggle(r.id)">
            <span class="rev-arrow" :class="{ open: expanded === r.id }">▸</span>
            <span class="rev-preview">{{ preview(r) }}</span>
          </button>
          <span class="rev-meta">{{ r.username || '系统' }} · {{ fmt(r.createdAt) }}</span>
          <button class="link-btn" :disabled="busy" @click="onRollback(r)">回滚</button>
        </div>
        <div v-if="expanded === r.id" class="rev-snap">
          <pre>{{ JSON.stringify(r.snapshot, null, 2) }}</pre>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.rev-panel {
  border-top: 1px solid var(--border);
  margin-top: 28px;
  padding-top: 18px;
}

.rev-title {
  font-size: 15px;
  font-weight: 700;
  margin: 0 0 4px;
}

.muted {
  color: var(--text-muted);
  font-size: 12px;
}

.rev-list {
  list-style: none;
  margin: 14px 0 0;
  padding: 0;
}

.rev-item {
  border-bottom: 1px solid var(--border);
}

.rev-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
}

.rev-expand {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13.5px;
  color: var(--text);
  flex: 1;
  min-width: 0;
  text-align: left;
}

.rev-arrow {
  color: var(--text-faint);
  transition: transform 0.15s ease;
  font-size: 10px;
}

.rev-arrow.open {
  transform: rotate(90deg);
}

.rev-preview {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rev-meta {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--text-faint);
  flex-shrink: 0;
}

.link-btn {
  background: none;
  border: none;
  color: var(--primary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 6px;
}

.link-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.rev-snap {
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 10px;
  margin-bottom: 10px;
  max-height: 280px;
  overflow: auto;
}

.rev-snap pre {
  margin: 0;
  font-size: 12px;
  font-family: var(--mono);
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
