<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api } from '../api/client';
import type { Article } from '@hyt/shared';
import Pagination from '../components/Pagination.vue';

const articles = ref<Article[]>([]);
const loading = ref(true);
const error = ref('');
const keyword = ref('');
const page = ref(1);
const pageSize = 8;
const total = ref(0);

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const res = await api.getArticles({ keyword: keyword.value || undefined, page: page.value, pageSize });
    articles.value = res.items;
    total.value = res.total;
  } catch (e: any) {
    error.value = e.message || '加载失败，请稍后重试';
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  page.value = 1;
  load();
}

function onPage(p: number) {
  page.value = p;
  load();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

onMounted(load);
</script>

<template>
  <section class="section">
    <div class="container">
      <div class="section-head" v-reveal>
        <span class="section-eyebrow">Blog</span>
        <h1 class="section-title">博客</h1>
        <p class="section-sub">项目进展与团队动态，记录每一次开源背后的思考。</p>
      </div>

      <div class="search-bar" v-reveal="'d-1'">
        <input
          v-model="keyword"
          class="search-input"
          type="search"
          placeholder="搜索文章标题、标签…"
          @keyup.enter="onSearch"
        />
        <button class="button button-primary" @click="onSearch">搜索</button>
      </div>

      <div v-if="loading" class="empty">loading…</div>
      <div v-else-if="error" class="empty error-text">{{ error }}</div>
      <div v-else-if="articles.length" class="grid">
        <router-link
          v-for="(a, i) in articles"
          :key="a.id"
          :to="`/blog/${a.slug}`"
          class="card blog-card"
          v-reveal="`d-${(i % 3) + 1}`"
        >
          <div class="blog-meta muted">
            <span class="date">{{ a.publishedAt ? new Date(a.publishedAt).toDateString() : '' }}</span>
            <span v-if="a.tags" class="tag">{{ a.tags.split(',')[0] }}</span>
          </div>
          <h3 class="blog-title">{{ a.title }}</h3>
          <p class="muted blog-summary">{{ a.summary }} <span class="arrow">→</span></p>
        </router-link>
      </div>
      <div v-else class="empty">
        {{ keyword ? `没有找到与「${keyword}」相关的文章` : '暂无文章，敬请期待。' }}
      </div>

      <Pagination :page="page" :page-size="pageSize" :total="total" @change="onPage" />
    </div>
  </section>
</template>

<style scoped>
.search-bar {
  display: flex;
  gap: 10px;
  max-width: 520px;
  margin: 0 auto 32px;
}

.search-input {
  flex: 1;
  height: 44px;
  padding: 0 16px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg);
  font-size: 14.5px;
  color: var(--text);
  outline: none;
  transition: border-color 0.16s ease, box-shadow 0.16s ease;
}

.search-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-soft);
}

.blog-card {
  display: block;
}

.blog-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  margin-bottom: 8px;
}

.date {
  color: var(--text-muted);
}

.blog-title {
  font-size: 19px;
  margin: 0 0 6px;
}

.blog-summary {
  margin: 0;
  font-size: 14px;
}

.arrow {
  color: var(--primary);
}
</style>