<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '../api/client';
import type { Article } from '@hyt/shared';
import MarkdownRenderer from '../components/MarkdownRenderer.vue';
import ShareBar from '../components/ShareBar.vue';
import { setSeo, setJsonLd } from '../composables/useSeo';

interface TocItem {
  level: number;
  text: string;
  id: string;
}

const route = useRoute();
const article = ref<Article | null>(null);
const error = ref('');
const toc = ref<TocItem[]>([]);
const mdRef = ref<InstanceType<typeof MarkdownRenderer> | null>(null);

const readingTime = computed(() => {
  const content = article.value?.content || '';
  if (!content) return 1;
  // 中文按字符数 / 400，粗略估算阅读时长
  return Math.max(1, Math.round(content.length / 400));
});

async function load() {
  error.value = '';
  article.value = null;
  toc.value = [];
  setJsonLd('article'); // 加载前先清理
  try {
    article.value = await api.getArticle(route.params.slug as string);
    const a = article.value;
    const seoTitle = a.seoTitle || a.title;
    const seoDesc = a.seoDescription || a.summary || '';
    const seoKeywords = a.seoKeywords || a.tags || '';
    setSeo(seoTitle, seoDesc, seoKeywords);
    // 注入 Article 结构化数据（生成式引擎优化 GEO）
    setJsonLd('article', {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: seoTitle,
      description: seoDesc,
      url: window.location.href,
      keywords: seoKeywords,
      ...(a.publishedAt ? { datePublished: a.publishedAt } : {}),
      dateModified: a.updatedAt,
      ...(a.coverUrl ? { image: a.coverUrl } : {}),
      author: { '@type': 'Organization', name: 'HYT Studio' },
    });
    await nextTick();
    buildToc();
  } catch (e: any) {
    error.value = e.message || '文章不存在';
  }
}

/** 从渲染后的 DOM 读取 h2/h3 锚点，构建目录 */
function buildToc() {
  const root = mdRef.value?.$el as HTMLElement | undefined;
  if (!root) return;
  const heads = Array.from(root.querySelectorAll('h2, h3')) as HTMLElement[];
  toc.value = heads.map((h) => ({
    level: Number(h.tagName.substring(1)),
    text: h.textContent || '',
    id: h.id,
  }));
}

onMounted(load);
watch(() => route.params.slug, load);
onUnmounted(() => setJsonLd('article'));
</script>

<template>
  <section class="section">
    <div class="container article">
      <div v-if="error" class="empty">{{ error }}</div>

      <div v-else-if="article" class="article-layout">
        <article class="card article-card">
          <router-link to="/blog" class="back muted">← 返回博客</router-link>
          <span class="ae-eyebrow">Blog / {{ article.slug }}</span>
          <h1 class="title">{{ article.title }}</h1>
          <p class="meta muted">
            <span>{{ article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : '' }}</span>
            <span v-if="article.tags">· {{ article.tags }}</span>
            <span>· 约 {{ readingTime }} 分钟阅读</span>
            <span>· 更新于 {{ new Date(article.updatedAt).toLocaleDateString() }}</span>
          </p>
          <div v-if="article.content" class="rich">
            <MarkdownRenderer ref="mdRef" :content="article.content" />
          </div>
          <div class="article-foot">
            <ShareBar :title="article.title" />
          </div>
        </article>

        <aside v-if="toc.length" class="toc">
          <div class="toc-inner">
            <span class="toc-label">目录</span>
            <nav class="toc-nav">
              <a
                v-for="t in toc"
                :key="t.id"
                :href="`#${t.id}`"
                class="toc-link"
                :class="`toc-l${t.level}`"
              >{{ t.text }}</a>
            </nav>
          </div>
        </aside>
      </div>

      <div v-else class="empty">loading…</div>
    </div>
  </section>
</template>

<style scoped>
.article {
  max-width: 1040px;
}

.article-layout {
  display: grid;
  grid-template-columns: 1fr 220px;
  gap: 28px;
  align-items: start;
}

.article-card {
  padding: 32px;
  min-width: 0;
}

.ae-eyebrow {
  display: inline-block;
  font-family: var(--mono);
  font-size: 12.5px;
  color: var(--green-deep);
  margin-bottom: 14px;
}

.back {
  font-size: 13px;
  display: inline-block;
  margin-bottom: 18px;
}

.title {
  font-size: 30px;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 0 0 10px;
  line-height: 1.25;
}

.meta {
  font-size: 13px;
  margin-bottom: 24px;
  padding-bottom: 18px;
  border-bottom: 1px dashed var(--border);
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.rich {
  margin-top: 8px;
}

.article-foot {
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
}

/* 目录 */
.toc {
  position: sticky;
  top: 84px;
}

.toc-inner {
  border-left: 2px solid var(--border);
  padding-left: 14px;
}

.toc-label {
  display: block;
  font-family: var(--mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-faint);
  margin-bottom: 10px;
}

.toc-nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.toc-link {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.45;
  transition: color 0.15s ease;
}

.toc-link:hover {
  color: var(--accent);
}

.toc-l3 {
  padding-left: 12px;
  font-size: 12.5px;
}

@media (max-width: 860px) {
  .article-layout {
    grid-template-columns: 1fr;
  }
  .toc {
    display: none;
  }
}
</style>
