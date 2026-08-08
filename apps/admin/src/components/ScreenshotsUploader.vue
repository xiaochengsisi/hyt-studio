<script setup lang="ts">
import { ref, watch } from 'vue';
import { adminApi } from '../api/client';

const props = defineProps<{ modelValue?: string }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>();

const list = ref<string[]>(split(props.modelValue));
const uploading = ref(false);

function split(v?: string): string[] {
  return (v || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function emitList() {
  emit('update:modelValue', list.value.join(','));
}

watch(
  () => props.modelValue,
  (val) => {
    const cur = list.value.join(',');
    if (val !== cur) list.value = split(val);
  },
);

async function onFiles(e: Event) {
  const input = e.target as HTMLInputElement;
  const files = Array.from(input.files || []);
  if (!files.length) return;
  uploading.value = true;
  try {
    for (const f of files) {
      const url = await adminApi.upload(f);
      list.value.push(url);
    }
    emitList();
  } finally {
    uploading.value = false;
    input.value = '';
  }
}

function remove(i: number) {
  list.value.splice(i, 1);
  emitList();
}

function move(i: number, dir: 1 | -1) {
  const j = i + dir;
  if (j < 0 || j >= list.value.length) return;
  const tmp = list.value[i];
  list.value[i] = list.value[j];
  list.value[j] = tmp;
  emitList();
}
</script>

<template>
  <div class="shots">
    <div v-if="list.length" class="shots-grid">
      <div v-for="(url, i) in list" :key="url" class="shot">
        <img :src="url" alt="screenshot" />
        <div class="shot-actions">
          <button type="button" class="shot-btn" :disabled="i === 0" @click="move(i, -1)" title="左移">←</button>
          <button type="button" class="shot-btn" :disabled="i === list.length - 1" @click="move(i, 1)" title="右移">→</button>
          <button type="button" class="shot-btn danger" @click="remove(i)" title="删除">×</button>
        </div>
      </div>
    </div>

    <label class="button button-ghost add-btn">
      {{ uploading ? '上传中…' : '+ 添加截图' }}
      <input type="file" accept="image/*" multiple class="file-input" @change="onFiles" />
    </label>
  </div>
</template>

<style scoped>
.shots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}

.shot {
  position: relative;
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
  aspect-ratio: 16 / 10;
  background: var(--bg-muted);
}

.shot img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.shot-actions {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 6px;
  padding-bottom: 8px;
  background: linear-gradient(0deg, rgba(0, 0, 0, 0.5), transparent 60%);
  opacity: 0;
  transition: opacity 0.15s ease;
}

.shot:hover .shot-actions {
  opacity: 1;
}

.shot-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: rgba(255, 255, 255, 0.9);
  color: var(--text);
  font-weight: 700;
  cursor: pointer;
}

.shot-btn.danger {
  background: #ef4444;
  color: #fff;
}

.shot-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.add-btn {
  cursor: pointer;
}

.file-input {
  display: none;
}
</style>