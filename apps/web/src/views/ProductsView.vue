<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '../api/client';
import type { Product } from '@hyt/shared';
import ProductCard from '../components/ProductCard.vue';
import Pagination from '../components/Pagination.vue';

const route = useRoute();
const products = ref<Product[]>([]);
const loading = ref(true);
const error = ref('');
const keyword = ref('');
const page = ref(1);
const pageSize = 9;
const total = ref(0);

const tags = ref<{ name: string; count: number }[]>([]);
const activeTag = ref('');
const languages = ref<{ name: string; count: number }[]>([]);
const activeLang = ref('');
const sort = ref<'default' | 'hot' | 'views' | 'likes' | 'stars' | 'newest'>(
  (route.query.sort as any) || 'default',
);

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const res = await api.getProducts({
      keyword: keyword.value || undefined,
      tag: activeTag.value || undefined,
      language: activeLang.value || undefined,
      sort: sort.value || undefined,
      page: page.value,
      pageSize,
    });
    products.value = res.items;
    total.value = res.total;
  } catch (e: any) {
    error.value = e.message || '加载失败，请稍后重试';
  } finally {
    loading.value = false;
  }
}

async function loadTags() {
  try {
    tags.value = await api.getProductsTags();
  } catch {
    tags.value = [];
  }
}

async function loadLanguages() {
  try {
    languages.value = await api.getProductsLanguages();
  } catch {
    languages.value = [];
  }
}

function onSearch() {
  page.value = 1;
  load();
}

function toggleTag(name: string) {
  activeTag.value = activeTag.value === name ? '' : name;
  page.value = 1;
  load();
}

function toggleLang(name: string) {
  activeLang.value = activeLang.value === name ? '' : name;
  page.value = 1;
  load();
}

function onSort() {
  page.value = 1;
  load();
}

function onPage(p: number) {
  page.value = p;
  load();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

onMounted(() => {
  loadTags();
  loadLanguages();
  load();
});
</script>

<template>
  <section class="section">
    <div class="container">
      <div class="section-head" v-reveal>
        <span class="section-eyebrow">Open source projects</span>
        <h1 class="section-title">开源项目</h1>
        <p class="section-sub">我们独立开发与维护的开源项目，开放源码，欢迎使用与贡献。</p>
      </div>

      <div class="search-bar" v-reveal="'d-1'">
        <input
          v-model="keyword"
          class="search-input"
          type="search"
          placeholder="搜索项目名称、标签、简介…"
          @keyup.enter="onSearch"
        />
        <button class="button button-primary" @click="onSearch">搜索</button>
      </div>

      <div class="filter-bar" v-reveal="'d-1'">
        <div v-if="languages.length" class="chip-row">
          <button
            class="tag-chip"
            :class="{ active: !activeLang }"
            @click="toggleLang('')"
          >全部语言</button>
          <button
            v-for="l in languages"
            :key="l.name"
            class="tag-chip"
            :class="{ active: activeLang === l.name }"
            @click="toggleLang(l.name)"
          >
            {{ l.name }}
            <span class="tag-count">{{ l.count }}</span>
          </button>
        </div>

        <div class="sort-wrap">
          <select v-model="sort" class="sort-select" @change="onSort">
            <option value="default">默认排序</option>
            <option value="hot">综合热度</option>
            <option value="views">浏览最多</option>
            <option value="likes">点赞最多</option>
            <option value="stars">Star 最多</option>
            <option value="newest">最新发布</option>
          </select>
        </div>
      </div>

      <div v-if="tags.length" class="tag-bar" v-reveal="'d-1'">
        <button
          class="tag-chip sm"
          :class="{ active: !activeTag }"
          @click="toggleTag('')"
        >全部标签</button>
        <button
          v-for="t in tags"
          :key="t.name"
          class="tag-chip sm"
          :class="{ active: activeTag === t.name }"
          @click="toggleTag(t.name)"
        >
          {{ t.name }}
          <span class="tag-count">{{ t.count }}</span>
        </button>
      </div>

      <div v-if="loading" class="empty">loading…</div>
      <div v-else-if="error" class="empty error-text">{{ error }}</div>
      <div v-else-if="products.length" class="grid grid-products">
        <div v-for="(p, i) in products" :key="p.id" v-reveal="`d-${(i % 3) + 1}`">
          <ProductCard :product="p" />
        </div>
      </div>
      <div v-else class="empty">
        {{ keyword || activeTag || activeLang ? `没有找到相关项目` : '暂无项目，敬请期待。' }}
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
  margin: 0 auto 24px;
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

.tag-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin: 0 auto 36px;
}

.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin: 0 auto 20px;
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.sort-wrap {
  margin-left: auto;
}

.sort-select {
  height: 36px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg);
  font-size: 13px;
  color: var(--text);
  cursor: pointer;
  outline: none;
}

.sort-select:focus {
  border-color: var(--primary);
}

.tag-chip.sm {
  padding: 4px 11px;
  font-size: 12px;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
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

.tag-chip:hover {
  color: var(--text);
  border-color: var(--text-faint);
}

.tag-chip.active {
  color: #fff;
  background: var(--ink);
  border-color: var(--ink);
}

.tag-count {
  font-size: 11px;
  opacity: 0.6;
}
</style>