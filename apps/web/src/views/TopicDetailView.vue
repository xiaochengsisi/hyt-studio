<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '../api/client';
import type { Topic } from '@hyt/shared';
import ProductCard from '../components/ProductCard.vue';

const route = useRoute();
const topic = ref<Topic | null>(null);
const loading = ref(true);
const error = ref('');

onMounted(async () => {
  try {
    topic.value = await api.getTopic(route.params.slug as string);
  } catch (e: any) {
    error.value = e.message || '加载失败';
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="page">
    <section v-if="loading" class="container section">
      <p class="loading">加载中…</p>
    </section>

    <section v-else-if="error" class="container section">
      <p class="error">{{ error }}</p>
      <router-link to="/topics" class="back">← 返回专题列表</router-link>
    </section>

    <template v-else-if="topic">
      <section class="hero">
        <div class="container hero-inner">
          <span class="eyebrow">Topic</span>
          <h1 class="title">{{ topic.name }}</h1>
          <p v-if="topic.description" class="desc">{{ topic.description }}</p>
          <router-link to="/topics" class="back">← 全部专题</router-link>
        </div>
      </section>

      <section class="container section">
        <div v-if="!topic.products?.length" class="empty">
          <p>该专题下暂无产品。</p>
        </div>
        <div v-else class="grid">
          <ProductCard
            v-for="p in topic.products"
            :key="p.id"
            :product="p"
          />
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.hero {
  background: var(--card);
  border-bottom: 1px solid var(--border);
  padding: 56px 24px;
}

.hero-inner {
  max-width: 880px;
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
  font-size: 40px;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0 0 12px;
}

.desc {
  color: var(--text-muted);
  font-size: 15px;
  margin: 0 0 18px;
  max-width: 640px;
}

.back {
  display: inline-block;
  font-size: 13px;
  color: var(--text-muted);
  text-decoration: none;
}

.back:hover {
  color: var(--accent);
}

.section {
  flex: 1;
  padding: 48px 24px 80px;
}

.loading,
.error,
.empty {
  text-align: center;
  color: var(--text-muted);
  padding: 60px 0;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}
</style>
