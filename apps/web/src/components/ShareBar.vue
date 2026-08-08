<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{ title?: string }>();

const copied = ref(false);

async function copyLink() {
  try {
    await navigator.clipboard.writeText(window.location.href);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1800);
  } catch {
    // 剪贴板不可用时静默失败
  }
}

function twitter() {
  const url = encodeURIComponent(window.location.href);
  const text = encodeURIComponent(props.title || '');
  window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank', 'noopener');
}

function weibo() {
  const url = encodeURIComponent(window.location.href);
  const text = encodeURIComponent(props.title || '');
  window.open(`https://service.weibo.com/share/share.php?url=${url}&title=${text}`, '_blank', 'noopener');
}
</script>

<template>
  <div class="share">
    <span class="share-label">分享</span>
    <button class="share-btn" :class="{ copied }" @click="copyLink">
      {{ copied ? '已复制' : '复制链接' }}
    </button>
    <button class="share-btn" @click="twitter">Twitter</button>
    <button class="share-btn" @click="weibo">微博</button>
  </div>
</template>

<style scoped>
.share {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.share-label {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--text-faint);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-right: 4px;
}

.share-btn {
  padding: 6px 13px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 999px;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}

.share-btn:hover {
  color: var(--text);
  border-color: var(--text-faint);
}

.share-btn.copied {
  color: #fff;
  background: var(--accent);
  border-color: var(--accent);
}
</style>
