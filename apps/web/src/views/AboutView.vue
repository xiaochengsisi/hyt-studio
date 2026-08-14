<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api } from '../api/client';
import type { SiteConfig } from '@hyt/shared';
import { resolveContent, type PageContent } from '../content';
import { safeUrl } from '../utils/safe-url';

const site = ref<SiteConfig | null>(null);
const content = ref<PageContent>(resolveContent());

onMounted(async () => {
  try {
    site.value = await api.getSiteConfig();
    content.value = resolveContent(site.value.content);
  } catch {
    /* ignore */
  }
});
</script>

<template>
  <section class="section">
    <div class="container about">
      <div class="section-head" v-reveal>
        <span class="section-eyebrow">{{ content.about.eyebrow }}</span>
        <h1 class="section-title">{{ content.about.title }}</h1>
        <p class="section-sub">{{ site?.slogan || 'Build open source, share the value.' }}</p>
      </div>

      <div class="card intro-card" v-reveal="'d-1'">
        <h2 class="intro-title">{{ content.about.introTitle }}</h2>
        <p class="intro-text">{{ content.about.introText }}</p>
      </div>

      <div class="grid grid-values" v-reveal="'d-2'">
        <div v-for="(v, i) in content.about.values" :key="v.title" class="card value-card">
          <div class="icon-tile" :class="`tone-${v.tone}`">{{ v.icon }}</div>
          <div>
            <h3 class="value-title">{{ v.title }}</h3>
            <p class="value-desc">{{ v.desc }}</p>
          </div>
        </div>
      </div>

      <div class="card contact-card" v-if="site" v-reveal="'d-3'">
        <h2 class="intro-title">{{ content.about.contactTitle }}</h2>
        <div class="contact-lines">
          <div class="contact-line">
            <span class="contact-label">邮箱</span>
            <a v-if="site.email" :href="`mailto:${site.email}`" class="contact-value">{{ site.email }}</a>
            <span v-else class="contact-value muted">—</span>
          </div>
          <div class="contact-line">
            <span class="contact-label">GitHub</span>
            <a v-if="site.github" :href="safeUrl(site.github)" target="_blank" rel="noopener" class="contact-value">{{ site.github }}</a>
            <span v-else class="contact-value muted">—</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.about {
  max-width: 820px;
}

.intro-card {
  padding: 28px;
  margin-bottom: 20px;
}

.intro-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 10px;
}

.intro-text {
  color: var(--text-muted);
  font-size: 15.5px;
  line-height: 1.8;
  margin: 0;
}

.grid-values {
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  margin-bottom: 20px;
}

.value-card {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.value-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 4px;
}

.value-desc {
  color: var(--text-muted);
  font-size: 14px;
  margin: 0;
  line-height: 1.6;
}

.contact-card {
  padding: 28px;
}

.contact-lines {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.contact-line {
  display: flex;
  gap: 16px;
  align-items: baseline;
}

.contact-label {
  min-width: 60px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-faint);
}

.contact-value {
  color: var(--primary-strong);
  font-size: 15px;
  word-break: break-all;
}
</style>