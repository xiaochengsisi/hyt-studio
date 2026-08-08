<script setup lang="ts">
import { ref } from 'vue';
import { adminApi } from '../api/client';

const props = defineProps<{ modelValue: string | undefined }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>();

const uploading = ref(false);
const error = ref('');

async function onFile(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  error.value = '';
  uploading.value = true;
  try {
    const url = await adminApi.upload(file);
    emit('update:modelValue', url);
  } catch (err: any) {
    error.value = err.message || '上传失败';
  } finally {
    uploading.value = false;
    input.value = '';
  }
}
</script>

<template>
  <div class="uploader">
    <div class="preview">
      <img v-if="modelValue" :src="modelValue" alt="预览" class="img" />
      <span v-else class="placeholder">empty</span>
    </div>
    <label class="button button-ghost upload-btn">
      {{ uploading ? 'uploading…' : 'upload' }}
      <input type="file" accept="image/*" @change="onFile" class="file-input" />
    </label>
    <input
      :value="modelValue || ''"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      class="input"
      placeholder="图片 URL"
    />
    <div v-if="error" class="alert alert-error">{{ error }}</div>
  </div>
</template>

<style scoped>
.uploader {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.preview {
  width: 120px;
  height: 90px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border);
  background: var(--bg-soft);
  display: flex;
  align-items: center;
  justify-content: center;
}

.img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.placeholder {
  color: var(--text-muted);
  font-size: 13px;
}

.upload-btn {
  align-self: flex-start;
}

.file-input {
  display: none;
}
</style>