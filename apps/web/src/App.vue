<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import SiteHeader from './components/SiteHeader.vue';
import SiteFooter from './components/SiteFooter.vue';
import BackToTop from './components/BackToTop.vue';
import { api } from './api/client';
import { applySiteSeo } from './composables/useSeo';
import type { SiteConfig } from '@hyt/shared';

const site = ref<SiteConfig | null>(null);

onMounted(async () => {
  try {
    site.value = await api.getSiteConfig();
  } catch {
    /* ignore */
  }
});

/** 站点级 SEO / GEO 配置变化时，同步到 <head> meta 标签 */
watch(
  site,
  (cfg) => {
    if (cfg) applySiteSeo(cfg);
  },
  { deep: true, immediate: true },
);

/** 将后台配置的统计代码注入到 <head>（原样执行 <script>） */
watch(
  () => site.value?.analyticsCode,
  (code) => {
    if (!code) return;
    const container = document.createElement('div');
    container.style.display = 'none';
    container.innerHTML = code;
    // 执行其中的 script
    container.querySelectorAll('script').forEach((old) => {
      const s = document.createElement('script');
      for (const attr of Array.from(old.attributes)) {
        s.setAttribute(attr.name, attr.value);
      }
      s.text = old.text;
      old.replaceWith(s);
    });
    document.head.appendChild(container);
  },
);
</script>

<template>
  <SiteHeader :site-name="site?.siteName || 'HYT Studio'" />
  <main>
    <router-view />
  </main>
  <SiteFooter
    :site="
      site || {
        id: 0,
        siteName: 'HYT Studio',
        slogan: '',
        description: '',
        createdAt: '',
        updatedAt: '',
      }
    "
  />
  <BackToTop />
</template>

<style scoped>
main {
  min-height: 60vh;
}
</style>