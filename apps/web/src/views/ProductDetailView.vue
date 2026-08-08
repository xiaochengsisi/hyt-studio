<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '../api/client';
import type { Product } from '@hyt/shared';
import MarkdownRenderer from '../components/MarkdownRenderer.vue';
import ShareBar from '../components/ShareBar.vue';
import { setSeo, setJsonLd } from '../composables/useSeo';

const route = useRoute();
const product = ref<Product | null>(null);
const related = ref<Product[]>([]);
const error = ref('');

async function load() {
  error.value = '';
  product.value = null;
  related.value = [];
  setJsonLd('product'); // 加载前先清理
  try {
    const slug = route.params.slug as string;
    product.value = await api.getProduct(slug);
    const p = product.value;
    const seoTitle = p.seoTitle || p.name;
    const seoDesc = p.seoDescription || p.tagline || p.description;
    const seoKeywords = p.seoKeywords || p.tags || '';
    setSeo(seoTitle, seoDesc, seoKeywords);
    // 注入 SoftwareApplication 结构化数据（生成式引擎优化 GEO）
    setJsonLd('product', {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: p.name,
      description: seoDesc,
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Web',
      url: window.location.href,
      ...(p.version ? { softwareVersion: p.version } : {}),
      keywords: seoKeywords,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
      ...(p.repoUrl ? { codeRepository: p.repoUrl } : {}),
      ...(p.homepage ? { isAccessibleForFree: true } : {}),
    });
    // 相关项目（按标签重合度），失败不影响主流程
    related.value = await api.getRelatedProducts(slug).catch(() => []);
  } catch (e: any) {
    error.value = e.message || 'repo not found';
  }
}

onMounted(load);
watch(() => route.params.slug, load);
onUnmounted(() => setJsonLd('product'));

function tagsList(tags?: string): string[] {
  return (tags || '').split(',').map((t) => t.trim()).filter(Boolean);
}

function letterFor(name: string): string {
  return (name.charAt(0) || 'P').toUpperCase();
}

function toneFor(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('cms') || n.includes('blog')) return 'tone-green';
  if (n.includes('ui') || n.includes('tui')) return 'tone-cyan';
  return 'tone-violet';
}

function screenshotsList(): string[] {
  return (product.value?.screenshots || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function fmtDate(s?: string): string {
  if (!s) return '';
  const d = new Date(s);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}
</script>

<template>
  <section class="section">
    <div class="container detail">
      <div v-if="error" class="empty">{{ error }}</div>

      <template v-else-if="product">
        <router-link to="/products" class="back" v-reveal>← 返回开源项目</router-link>

        <div class="card hero-card" v-reveal="'d-1'">
          <div class="dh-head">
            <div class="icon-tile dh-icon" :class="toneFor(product.name)">{{ letterFor(product.name) }}</div>
            <div class="dh-titles">
              <h1 class="dh-name">{{ product.name }}</h1>
              <div class="dh-tags">
                <span v-for="t in tagsList(product.tags)" :key="t" class="tag tag-brand">{{ t }}</span>
              </div>
            </div>
            <div class="dh-ver">
              <span class="dh-ver-dot"></span>
              v{{ product.version || '?' }}
            </div>
          </div>
          <p class="dh-tagline">{{ product.tagline }}</p>
        </div>

        <div v-if="screenshotsList().length" class="card shots-card" v-reveal="'d-2'">
          <h2 class="bc-title">项目截图</h2>
          <div class="shots">
            <img v-for="(s, i) in screenshotsList()" :key="i" :src="s" alt="screenshot" loading="lazy" />
          </div>
        </div>

        <div class="card body-card" v-reveal="'d-3'">
          <h2 class="bc-title">项目简介</h2>
          <p class="bc-text">{{ product.description }}</p>

          <div v-if="product.content">
            <h2 class="bc-title">详细介绍</h2>
            <div class="bc-md">
              <MarkdownRenderer :content="product.content" />
            </div>
          </div>

          <div class="actions" v-if="product.repoUrl || product.homepage || product.docsUrl">
            <a v-if="product.repoUrl" :href="product.repoUrl" target="_blank" rel="noopener" class="button button-primary">GitHub 仓库 ↗</a>
            <a v-if="product.homepage" :href="product.homepage" target="_blank" rel="noopener" class="button">在线演示</a>
            <a v-if="product.docsUrl" :href="product.docsUrl" target="_blank" rel="noopener" class="button">文档</a>
          </div>

          <div class="detail-foot">
            <span class="updated muted">更新于 {{ fmtDate(product.updatedAt) }}</span>
            <ShareBar :title="product.name" />
          </div>
        </div>

        <!-- 相关项目 -->
        <div v-if="related.length" class="card related-card" v-reveal="'d-4'">
          <h2 class="bc-title">相关项目</h2>
          <div class="related-list">
            <router-link
              v-for="r in related"
              :key="r.id"
              :to="`/products/${r.slug}`"
              class="related-item"
            >
              <span class="related-icon" :class="toneFor(r.name)">{{ letterFor(r.name) }}</span>
              <div class="related-main">
                <span class="related-name">{{ r.name }}</span>
                <span class="related-tagline muted">{{ r.tagline }}</span>
              </div>
              <span class="related-arrow">→</span>
            </router-link>
          </div>
        </div>
      </template>

      <div v-else class="empty">loading…</div>
    </div>
  </section>
</template>

<style scoped>
.detail {
  max-width: 820px;
}

.back {
  font-size: 14px;
  color: var(--text-muted);
  display: inline-block;
  margin-bottom: 20px;
  transition: color 0.15s ease;
}

.back:hover {
  color: var(--primary-strong);
}

/* 产品头部卡片 */
.hero-card {
  margin-bottom: 20px;
  padding: 28px;
}

.dh-head {
  display: flex;
  align-items: center;
  gap: 16px;
}

.dh-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  font-size: 26px;
  flex-shrink: 0;
}

.dh-titles {
  flex: 1;
  min-width: 0;
}

.dh-name {
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 0 0 8px;
}

.dh-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.dh-ver {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--mono);
  font-size: 14px;
  color: var(--text-muted);
  background: var(--primary-soft);
  padding: 6px 12px;
  border-radius: 999px;
  flex-shrink: 0;
}

.dh-ver-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-soft);
}

.dh-tagline {
  font-size: 17px;
  color: var(--text-muted);
  line-height: 1.7;
  margin: 18px 0 0;
}

/* 详情 */
.shots-card {
  margin-bottom: 20px;
  padding: 28px;
}

.shots {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
  margin-top: 16px;
}

.shots img {
  width: 100%;
  border-radius: 10px;
  border: 1px solid var(--border);
  aspect-ratio: 16 / 10;
  object-fit: cover;
}

.body-card {
  padding: 28px;
}

.bc-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 10px;
}

.bc-title:not(:first-child) {
  margin-top: 26px;
}

.bc-text {
  color: var(--text-muted);
  font-size: 15.5px;
  line-height: 1.8;
  margin: 0;
  white-space: pre-line;
}

.actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 28px;
  padding-top: 24px;
  border-top: 1px solid var(--border);
}

.detail-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 20px;
}

.updated {
  font-size: 13px;
}

.related-card {
  margin-top: 20px;
  padding: 28px;
}

.related-list {
  display: flex;
  flex-direction: column;
  margin-top: 14px;
}

.related-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 4px;
  border-bottom: 1px solid var(--border);
  transition: background 0.15s ease;
}

.related-item:last-child {
  border-bottom: none;
}

.related-item:hover {
  background: var(--bg-soft);
}

.related-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 17px;
  flex-shrink: 0;
}

.related-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.related-name {
  font-weight: 600;
  font-size: 15px;
  transition: color 0.15s ease;
}

.related-item:hover .related-name {
  color: var(--accent);
}

.related-tagline {
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.related-arrow {
  color: var(--text-faint);
  transition: transform 0.15s ease, color 0.15s ease;
}

.related-item:hover .related-arrow {
  transform: translateX(4px);
  color: var(--accent);
}
</style>