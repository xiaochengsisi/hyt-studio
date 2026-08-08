<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api } from '../api/client';
import type { Topic } from '@hyt/shared';
import SiteHeader from '../components/SiteHeader.vue';
import SiteFooter from '../components/SiteFooter.vue';

const topics = ref<Topic[]>([]);
const loading = ref(true);
const error = ref('');

onMounted(async () => {
  try {
    topics.value = await api.getTopics();
  } catch (e: any) {
    error.value = e.message || '加载失败';
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="page">
    <SiteHeader />

    <section class="container section">
      <div class="section-head">
        <span class="eyebrow">Topics</span>
        <h1 class="title">专题合集</h1>
        <p class="subtitle">围绕特定主题精心策展的项目集合，一站看完相关生态。</p>
      </div>

      <div v-if="loading" class="loading">加载中…</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <div v-else-if="!topics.length" class="empty">
        <p>暂无专题，敬请期待。</p>
      </div>
      <div v-else class="grid">
        <router-link
          v-for="t in topics"
          :key="t.id"
          :to="`/topics/${t.slug}`"
          class="topic-card"
        >
          <div class="cover" :style="t.coverUrl ? `background-image:url(${t.coverUrl})` : ''">
            <span v-if="!t.coverUrl" class="cover-fallback">{{ t.name?.charAt(0) }}</span>
          </div>
          <div class="body">
            <h3 class="name">{{ t.name }}</h3>
            <p class="desc">{{ t.description || '—' }}</p>
            <span class="cta">查看专题 →</span>
          </div>
        </router-link>
      </div>
    </section>

    <SiteFooter />
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.section {
  flex: 1;
  padding: 64px 24px 80px;
}

.section-head {
  max-width: 640px;
  margin-bottom: 40px;
}

.eyebrow {
  display: inline-block;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 10px;
}

.title {
  font-size: 36px;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0 0 12px;
}

.subtitle {
  color: var(--text-muted);
  font-size: 15px;
  margin: 0;
}

.loading,
.error,
.empty {
  padding: 60px 0;
  text-align: center;
  color: var(--text-muted);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.topic-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.18s ease, transform 0.18s ease;
}

.topic-card:hover {
  border-color: var(--accent);
  transform: translateY(-2px);
}

.cover {
  height: 160px;
  background: var(--bg-soft);
  background-size: cover;
  background-position: center;
  display: grid;
  place-items: center;
}

.cover-fallback {
  font-size: 48px;
  font-weight: 700;
  color: var(--accent);
}

.body {
  padding: 20px;
}

.name {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 8px;
  letter-spacing: -0.01em;
}

.desc {
  font-size: 13.5px;
  color: var(--text-muted);
  margin: 0 0 14px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 38px;
}

.cta {
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
}
</style>
