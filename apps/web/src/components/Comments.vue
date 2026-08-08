<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { api } from '../api/client';
import type { SiteConfig } from '@hyt/shared';

const props = defineProps<{ mapping?: string }>();
const site = ref<SiteConfig | null>(null);
const container = ref<HTMLElement | null>(null);

async function loadConfig() {
  try {
    site.value = await api.getSiteConfig();
  } catch {
    site.value = null;
  }
}

/** 渲染 Giscus 挂件：每次配置或 mapping 变化时重建 iframe */
function render() {
  const c = site.value;
  const el = container.value;
  if (!el || !c?.giscusRepo || !c?.giscusRepoId) return;
  el.innerHTML = '';
  const s = document.createElement('script');
  s.src = 'https://giscus.app/client.js';
  s.setAttribute('data-repo', c.giscusRepo);
  s.setAttribute('data-repo-id', c.giscusRepoId);
  s.setAttribute('data-category', c.giscusCategory || 'Announcements');
  s.setAttribute('data-category-id', c.giscusCategoryId || '');
  s.setAttribute('data-mapping', props.mapping || 'specific');
  s.setAttribute('data-strict', '0');
  s.setAttribute('data-reactions-enabled', '1');
  s.setAttribute('data-emit-metadata', '0');
  s.setAttribute('data-input-position', 'top');
  s.setAttribute('data-theme', 'light');
  s.setAttribute('data-lang', 'zh-CN');
  s.setAttribute('data-loading', 'lazy');
  s.crossOrigin = 'anonymous';
  s.async = true;
  el.appendChild(s);
}

onMounted(async () => {
  await loadConfig();
  render();
});

watch(() => props.mapping, render);
</script>

<template>
  <div v-if="site?.giscusRepo && site?.giscusRepoId" class="comments">
    <div ref="container" class="giscus"></div>
  </div>
</template>

<style scoped>
.comments {
  margin-top: 28px;
}
.giscus :deep(iframe) {
  width: 100% !important;
}
</style>
