<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api } from '../api/client';
import type { Article, Product } from '@hyt/shared';
import Skeleton from '../components/Skeleton.vue';
import ProductCard from '../components/ProductCard.vue';
import { resolveContent, type PageContent } from '../content';

const products = ref<Product[]>([]);
const hotProducts = ref<Product[]>([]);
const articles = ref<Article[]>([]);
const loading = ref(true);
const content = ref<PageContent>(resolveContent());

onMounted(async () => {
  try {
    const [cfg, all, hot, latest] = await Promise.all([
      api.getSiteConfig(),
      api.getProducts(),
      api.getHotProducts().catch(() => [] as Product[]),
      api.getArticles({ pageSize: 3 }).catch(() => ({ items: [] as Article[], total: 0 })),
    ]);
    content.value = resolveContent(cfg.content);
    products.value = all.items;
    // 热门项目排除与首屏精选重复的，最多取 4 个
    const featuredIds = new Set(all.items.slice(0, 4).map((p) => p.id));
    hotProducts.value = hot.filter((p) => !featuredIds.has(p.id)).slice(0, 4);
    articles.value = latest.items;
  } finally {
    loading.value = false;
  }
});

function tagsList(tags?: string): string[] {
  return (tags || '').split(',').map((t) => t.trim()).filter(Boolean).slice(0, 3);
}

function pad(n: number): string {
  return String(n + 1).padStart(2, '0');
}

function articleDate(s?: string): string {
  if (!s) return '';
  const d = new Date(s);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}
</script>

<template>
  <!-- ============ HERO：单列，文本驱动，无装饰 ============ -->
  <section class="hero">
    <div class="container">
      <p class="hero-kicker" v-reveal>HYT Studio · 独立开源工作室</p>
      <h1 class="hero-title" v-reveal="'d-1'">
        {{ content.hero.titleLine1 }}<br />
        {{ content.hero.titleLine2 }}
      </h1>
      <p class="hero-sub" v-reveal="'d-2'">{{ content.hero.subtitle }}</p>
      <div class="hero-actions" v-reveal="'d-3'">
        <router-link to="/products" class="button button-primary button-lg">浏览项目</router-link>
        <router-link to="/about" class="text-link">关于工作室<span class="tl-arrow">→</span></router-link>
      </div>
    </div>
  </section>

  <!-- ============ 项目（首页主体） ============ -->
  <section class="section">
    <div class="container">
      <div class="section-head" v-reveal>
        <div class="section-head-main">
          <span class="section-eyebrow">项目</span>
          <h2 class="section-title">我们维护的开源项目</h2>
        </div>
        <router-link to="/products" class="text-link">全部<span class="tl-arrow">→</span></router-link>
      </div>

      <Skeleton v-if="loading" :lines="4" />
      <div v-else-if="products.length" class="rows">
        <router-link
          v-for="(p, i) in products"
          :key="p.id"
          :to="`/products/${p.slug}`"
          class="row"
          v-reveal="`d-${(i % 4) + 1}`"
        >
          <span class="row-index">{{ pad(i) }}</span>
          <div class="row-main">
            <div class="row-name-line">
              <span class="row-name">{{ p.name }}</span>
              <span class="row-ver mono">v{{ p.version || '—' }}</span>
            </div>
            <p class="row-desc">{{ p.tagline }}</p>
            <div class="row-tags">
              <span v-for="t in tagsList(p.tags)" :key="t" class="tag">{{ t }}</span>
            </div>
          </div>
          <span class="row-arrow">→</span>
        </router-link>
      </div>
      <div v-else class="empty">还没有项目。</div>
    </div>
  </section>

  <!-- ============ 热门项目（综合浏览+点赞+star） ============ -->
  <section v-if="hotProducts.length" class="section">
    <div class="container">
      <div class="section-head" v-reveal>
        <div class="section-head-main">
          <span class="section-eyebrow">热门</span>
          <h2 class="section-title">社区最爱</h2>
          <p class="section-sub">按浏览量、点赞与 GitHub Star 综合排序。</p>
        </div>
        <router-link to="/products?sort=hot" class="text-link">全部<span class="tl-arrow">→</span></router-link>
      </div>
      <div class="grid grid-products">
        <div v-for="(p, i) in hotProducts" :key="p.id" v-reveal="`d-${(i % 4) + 1}`">
          <ProductCard :product="p" />
        </div>
      </div>
    </div>
  </section>

  <!-- ============ 最新文章 ============ -->
  <section v-if="articles.length" class="section">
    <div class="container">
      <div class="section-head" v-reveal>
        <div class="section-head-main">
          <span class="section-eyebrow">博客</span>
          <h2 class="section-title">最新文章</h2>
        </div>
        <router-link to="/blog" class="text-link">全部<span class="tl-arrow">→</span></router-link>
      </div>

      <div class="post-rows">
        <router-link
          v-for="(a, i) in articles"
          :key="a.id"
          :to="`/blog/${a.slug}`"
          class="post-row"
          v-reveal="`d-${(i % 3) + 1}`"
        >
          <div class="post-main">
            <h3 class="post-title">{{ a.title }}</h3>
            <p v-if="a.summary" class="post-sum">{{ a.summary }}</p>
          </div>
          <span class="post-date mono">{{ articleDate(a.publishedAt || a.createdAt) }}</span>
        </router-link>
      </div>
    </div>
  </section>

  <!-- ============ 关于工作室（精简，替代 Why 区） ============ -->
  <section class="section about-strip">
    <div class="container about-grid">
      <div class="about-text" v-reveal>
        <span class="section-eyebrow">关于</span>
        <h2 class="about-title">{{ content.features.title }}</h2>
        <p class="about-lead">{{ content.features.subtitle }}</p>
        <ul class="about-list">
          <li v-for="f in content.features.items" :key="f.title">
            <span class="about-li-title">{{ f.title }}</span>
            <span class="about-li-desc">{{ f.desc }}</span>
          </li>
        </ul>
      </div>
      <div class="about-aside" v-reveal="'d-2'">
        <div class="aside-block">
          <span class="aside-label">协议</span>
          <span class="aside-value">MIT License</span>
        </div>
        <div class="aside-block">
          <span class="aside-label">协作</span>
          <span class="aside-value">Issues / PR Welcome</span>
        </div>
        <div class="aside-block">
          <span class="aside-label">技术栈</span>
          <span class="aside-value">Vue · Node · SQLite</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* ===== HERO ===== */
.hero {
  padding: 96px 0 56px;
  border-bottom: 1px solid var(--line);
}

.hero-kicker {
  font-family: var(--mono);
  font-size: 13px;
  color: var(--text-faint);
  margin: 0 0 24px;
  letter-spacing: 0.02em;
}

.hero-title {
  font-size: clamp(36px, 5vw, 58px);
  font-weight: 700;
  line-height: 1.08;
  letter-spacing: -0.035em;
  margin: 0 0 24px;
  max-width: 820px;
}

.hero-sub {
  font-size: 18px;
  color: var(--text-muted);
  line-height: 1.75;
  margin: 0 0 36px;
  max-width: 560px;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 28px;
  flex-wrap: wrap;
}

.text-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 600;
  color: var(--ink);
  border-bottom: 1px solid var(--ink);
  padding-bottom: 2px;
  transition: color 0.18s ease, border-color 0.18s ease;
}

.text-link:hover {
  color: var(--accent);
  border-color: var(--accent);
}

.tl-arrow {
  transition: transform 0.18s ease;
}

.text-link:hover .tl-arrow {
  transform: translateX(4px);
}

/* ===== 区块 ===== */
.section {
  padding: 80px 0;
}

.section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 40px;
  border-bottom: 1px solid var(--line);
  padding-bottom: 20px;
}

.section-eyebrow {
  display: block;
  font-family: var(--mono);
  font-size: 12px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-faint);
  margin-bottom: 8px;
}

.section-title {
  font-size: clamp(26px, 3.4vw, 36px);
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.15;
  margin: 0;
}

/* ===== 项目行列表（首页主体） ===== */
.rows {
  border-top: 1px solid var(--line);
}

.row {
  display: grid;
  grid-template-columns: 48px 1fr 32px;
  align-items: start;
  gap: 20px;
  padding: 24px 4px;
  border-bottom: 1px solid var(--line);
  transition: background 0.16s ease;
}

.row:hover {
  background: var(--bg-soft);
}

.row-index {
  font-family: var(--mono);
  font-size: 13px;
  color: var(--text-faint);
  padding-top: 4px;
}

.row-main {
  min-width: 0;
}

.row-name-line {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.row-name {
  font-size: 19px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.row:hover .row-name {
  color: var(--accent);
}

.row-ver {
  font-size: 12px;
  color: var(--text-faint);
}

.row-desc {
  color: var(--text-muted);
  font-size: 15px;
  line-height: 1.65;
  margin: 0 0 12px;
}

.row-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.row-arrow {
  font-size: 18px;
  color: var(--text-faint);
  padding-top: 4px;
  text-align: right;
  transition: transform 0.18s ease, color 0.18s ease;
}

.row:hover .row-arrow {
  transform: translateX(4px);
  color: var(--accent);
}

/* ===== 最新文章 ===== */
.post-rows {
  border-top: 1px solid var(--line);
}

.post-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 22px 4px;
  border-bottom: 1px solid var(--line);
  transition: background 0.16s ease;
}

.post-row:hover {
  background: var(--bg-soft);
}

.post-main {
  min-width: 0;
}

.post-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 4px;
  transition: color 0.15s ease;
}

.post-row:hover .post-title {
  color: var(--accent);
}

.post-sum {
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 640px;
}

.post-date {
  font-size: 13px;
  color: var(--text-faint);
  flex-shrink: 0;
  white-space: nowrap;
}

/* ===== 关于区 ===== */
.about-strip {
  background: var(--bg-soft);
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}

.about-grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 64px;
  align-items: start;
}

.about-text .section-eyebrow {
  margin-bottom: 12px;
}

.about-title {
  font-size: clamp(26px, 3.4vw, 36px);
  font-weight: 700;
  letter-spacing: -0.025em;
  margin: 0 0 18px;
}

.about-lead {
  color: var(--text-muted);
  font-size: 16.5px;
  line-height: 1.8;
  margin: 0 0 32px;
  max-width: 520px;
}

.about-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px 32px;
}

.about-list li {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.about-li-title {
  font-weight: 700;
  font-size: 15px;
}

.about-li-desc {
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.65;
}

.about-aside {
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 1px solid var(--line);
  background: var(--bg);
}

.aside-block {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid var(--line);
}

.aside-block:last-child {
  border-bottom: none;
}

.aside-label {
  font-family: var(--mono);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-faint);
}

.aside-value {
  font-weight: 600;
  font-size: 14px;
}

/* ===== 响应式 ===== */
@media (max-width: 860px) {
  .about-grid {
    grid-template-columns: 1fr;
    gap: 36px;
  }
  .about-list {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .hero { padding: 64px 0 40px; }
  .section { padding: 56px 0; }
  .row { grid-template-columns: 32px 1fr; }
  .row-arrow { display: none; }
}
</style>