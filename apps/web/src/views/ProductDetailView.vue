<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '../api/client';
import type { Product } from '@hyt/shared';
import MarkdownRenderer from '../components/MarkdownRenderer.vue';
import ShareBar from '../components/ShareBar.vue';
import Comments from '../components/Comments.vue';
import { setSeo, setJsonLd } from '../composables/useSeo';
import { getAnonId, getLikedSlugs, setLiked, fmtCount } from '../utils/anon-id';

const route = useRoute();
const product = ref<Product | null>(null);
const related = ref<Product[]>([]);
const error = ref('');
const liked = ref(false);
const likeCount = ref(0);
const likeBusy = ref(false);

async function load() {
  error.value = '';
  product.value = null;
  related.value = [];
  setJsonLd('product'); // 加载前先清理
  try {
    const slug = route.params.slug as string;
    product.value = await api.getProduct(slug);
    const p = product.value;
    likeCount.value = p.likeCount;
    liked.value = getLikedSlugs().has(slug);
    const seoTitle = p.seoTitle || p.name;
    const seoDesc = p.seoDescription || p.tagline || p.description;
    const seoKeywords = p.seoKeywords || p.tags || '';
    // 产品分享卡片图（绝对 URL，供社交平台抓取）
    const ogImage = `${window.location.origin}/api/og/product/${slug}.png`;
    setSeo(seoTitle, seoDesc, seoKeywords, ogImage);
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
      ...(p.githubStars ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: '5', ratingCount: p.githubStars } } : {}),
    });
    // 相关项目（按标签重合度），失败不影响主流程
    related.value = await api.getRelatedProducts(slug).catch(() => []);
  } catch (e: any) {
    error.value = e.message || 'repo not found';
  }
}

async function onLike() {
  if (!product.value || likeBusy.value) return;
  likeBusy.value = true;
  const slug = product.value.slug;
  try {
    const res = await api.toggleLike(slug, getAnonId());
    liked.value = res.liked;
    likeCount.value = res.likeCount;
    setLiked(slug, res.liked);
  } catch {
    /* ignore */
  } finally {
    likeBusy.value = false;
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

        <!-- GitHub 数据统计 -->
        <div v-if="product.githubStars || product.githubForks || product.language" class="card stats-card" v-reveal="'d-2'">
          <div class="stats-grid">
            <div class="stat-item" v-if="product.githubStars > 0">
              <span class="stat-num">★ {{ fmtCount(product.githubStars) }}</span>
              <span class="stat-label">Stars</span>
            </div>
            <div class="stat-item" v-if="product.githubForks > 0">
              <span class="stat-num">{{ fmtCount(product.githubForks) }}</span>
              <span class="stat-label">Forks</span>
            </div>
            <div class="stat-item" v-if="product.githubOpenIssues > 0">
              <span class="stat-num">{{ fmtCount(product.githubOpenIssues) }}</span>
              <span class="stat-label">Issues</span>
            </div>
            <div class="stat-item" v-if="product.language">
              <span class="stat-num">{{ product.language }}</span>
              <span class="stat-label">Language</span>
            </div>
            <div class="stat-item" v-if="product.githubLicense">
              <span class="stat-num">{{ product.githubLicense }}</span>
              <span class="stat-label">License</span>
            </div>
            <div class="stat-item" v-if="product.githubUpdatedAt">
              <span class="stat-num">{{ fmtDate(product.githubUpdatedAt) }}</span>
              <span class="stat-label">GitHub 更新</span>
            </div>
          </div>
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
            <span class="updated muted">更新于 {{ fmtDate(product.updatedAt) }} · {{ fmtCount(product.viewCount) }} 次浏览</span>
            <div class="foot-actions">
              <button
                class="like-btn"
                :class="{ liked }"
                :disabled="likeBusy"
                @click="onLike"
              >
                <span class="like-icon">{{ liked ? '♥' : '♡' }}</span>
                <span>{{ fmtCount(likeCount) }}</span>
              </button>
              <ShareBar :title="product.name" />
            </div>
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

        <!-- 评论区（Giscus，基于 GitHub Discussions） -->
        <div class="card related-card" v-reveal="'d-4'">
          <h2 class="bc-title">评论</h2>
          <Comments :mapping="`specific:${product.slug}`" />
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

/* GitHub 数据统计 */
.stats-card {
  margin-bottom: 20px;
  padding: 20px 28px;
}

.stats-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 28px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-num {
  font-family: var(--mono);
  font-size: 17px;
  font-weight: 700;
  color: var(--text);
}

.stat-label {
  font-size: 12px;
  color: var(--text-faint);
}

/* 点赞按钮 */
.foot-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.like-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  font-family: var(--mono);
  font-size: 14px;
  font-weight: 600;
  color: var(--text-muted);
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 999px;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}

.like-btn:hover:not(:disabled) {
  border-color: var(--text-faint);
}

.like-btn.liked {
  color: #ef4444;
  border-color: #fecaca;
  background: #fef2f2;
}

.like-icon {
  font-size: 16px;
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