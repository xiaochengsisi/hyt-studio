<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { adminApi } from '../api/client';
import ImageUploader from '../components/ImageUploader.vue';
import MarkdownEditor from '../components/MarkdownEditor.vue';
import ScreenshotsUploader from '../components/ScreenshotsUploader.vue';
import RevisionsPanel from '../components/RevisionsPanel.vue';
import TranslationsPanel from '../components/TranslationsPanel.vue';
import type { Product } from '@hyt/shared';

/** 产品可翻译字段定义 */
const translationFields = [
  { key: 'name', label: '名称' },
  { key: 'tagline', label: '一句话简介' },
  { key: 'description', label: '项目简介', multiline: true },
  { key: 'content', label: '详细介绍', multiline: true },
];

const route = useRoute();
const router = useRouter();
const isEdit = route.name === 'product-edit';
const id = Number(route.params.id);

// 是否已手动编辑过 slug（手动编辑后不再随名称自动更新）
const slugTouched = ref(isEdit);

const form = reactive<Partial<Product>>({
  name: '',
  slug: '',
  tagline: '',
  description: '',
  content: '',
  logoUrl: '',
  screenshots: '',
  tags: '',
  repoUrl: '',
  homepage: '',
  docsUrl: '',
  version: '',
  language: '',
  category: '',
  status: 'draft',
  featured: false,
  sortOrder: 0,
  scheduledAt: '',
  seoTitle: '',
  seoDescription: '',
  seoKeywords: '',
});

const saving = ref(false);
const generating = ref(false);
const syncing = ref(false);
const error = ref('');
const success = ref('');

function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}\-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

let autoSlug = false;
watch(
  () => form.slug,
  () => {
    if (!autoSlug) slugTouched.value = true;
  },
);
watch(
  () => form.name,
  (val) => {
    if (!isEdit && !slugTouched.value) {
      autoSlug = true;
      form.slug = slugify(val || '');
      autoSlug = false;
    }
  },
);

onMounted(async () => {
  if (isEdit) {
    const p = await adminApi.getProduct(id);
    Object.assign(form, p);
  }
});

async function onSubmit() {
  error.value = '';
  success.value = '';
  saving.value = true;
  try {
    if (isEdit) {
      await adminApi.updateProduct(id, form);
      success.value = '已保存';
    } else {
      await adminApi.createProduct(form);
      router.push('/products');
    }
  } catch (e: any) {
    error.value = e.message || '保存失败';
  } finally {
    saving.value = false;
  }
}

/** 用 AI 根据正文生成 SEO 标题/描述/关键词 */
async function generateSeo() {
  if (!form.name && !form.content) {
    error.value = '请先填写名称或正文后再生成 SEO';
    return;
  }
  error.value = '';
  success.value = '';
  generating.value = true;
  try {
    const res = await adminApi.generateSeo({
      type: 'product',
      name: form.name || '',
      content: form.content,
      tags: form.tags,
    });
    form.seoTitle = res.seoTitle;
    form.seoDescription = res.seoDescription;
    form.seoKeywords = res.seoKeywords;
    success.value = 'AI 已生成 SEO，可在保存后生效';
  } catch (e: any) {
    error.value = e.message || 'AI 生成失败';
  } finally {
    generating.value = false;
  }
}

/** 从 GitHub 同步仓库数据：stars/forks/语言/版本等 */
async function syncGithub() {
  if (!form.repoUrl) {
    error.value = '请先填写 GitHub 仓库 URL';
    return;
  }
  error.value = '';
  success.value = '';
  syncing.value = true;
  try {
    const p = await adminApi.syncGithub(id);
    Object.assign(form, p);
    success.value = `已同步 GitHub 数据（★ ${p.githubStars} · ${p.language || '—'})`;
  } catch (e: any) {
    error.value = e.message || '同步失败';
  } finally {
    syncing.value = false;
  }
}
</script>

<template>
  <div>
    <div class="page-head">
      <h1 class="page-title">{{ isEdit ? '编辑产品' : '新建产品' }}</h1>
      <router-link to="/products" class="button button-ghost">返回</router-link>
    </div>
    <form class="card" @submit.prevent="onSubmit">
      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <div v-if="success" class="alert alert-success">{{ success }}</div>

      <div class="form-grid">
        <div class="field">
          <label class="label">名称 *</label>
          <input class="input" v-model="form.name" required />
        </div>
        <div class="field">
          <label class="label">Slug *</label>
          <input class="input" v-model="form.slug" placeholder="my-project" required />
          <small class="muted">根据名称自动生成；手动修改后将不再自动覆盖。</small>
        </div>
        <div class="field">
          <label class="label">一句话简介</label>
          <input class="input" v-model="form.tagline" />
        </div>
        <div class="field">
          <label class="label">版本</label>
          <input class="input" v-model="form.version" placeholder="1.0.0" />
        </div>
      </div>

      <div class="field">
        <label class="label">Logo</label>
        <ImageUploader v-model="form.logoUrl" />
      </div>

      <div class="field">
        <label class="label">项目截图（可多张，左移/右移调整顺序）</label>
        <ScreenshotsUploader v-model="form.screenshots" />
      </div>

      <div class="form-grid">
        <div class="field">
          <label class="label">GitHub 仓库 URL</label>
          <input class="input" v-model="form.repoUrl" placeholder="https://github.com/..." />
        </div>
        <div class="field">
          <label class="label">官网 URL</label>
          <input class="input" v-model="form.homepage" />
        </div>
        <div class="field">
          <label class="label">文档 URL</label>
          <input class="input" v-model="form.docsUrl" />
        </div>
        <div class="field">
          <label class="label">标签（逗号分隔）</label>
          <input class="input" v-model="form.tags" placeholder="web, 工具, 开源" />
        </div>
        <div class="field">
          <label class="label">编程语言</label>
          <input class="input" v-model="form.language" placeholder="可由 GitHub 同步，也可手动填写" />
        </div>
        <div class="field">
          <label class="label">分类</label>
          <input class="input" v-model="form.category" placeholder="如：工具 / 框架 / 应用 / 库" />
        </div>
      </div>

      <div v-if="isEdit" class="field">
        <button class="button button-ghost" type="button" :disabled="syncing" @click="syncGithub">
          {{ syncing ? '同步中…' : '↻ 从 GitHub 同步数据' }}
        </button>
        <small class="muted" style="margin-left: 10px">抓取 stars / forks / 语言 / license / 最新版本，自动填充。</small>
      </div>

      <div class="field">
        <label class="label">项目简介</label>
        <textarea class="textarea" v-model="form.description"></textarea>
      </div>

      <div class="field">
        <label class="label">详细介绍（支持 Markdown）</label>
        <MarkdownEditor v-model="form.content" />
        <small class="muted">支持 Markdown 语法，预览渲染效果后再保存。</small>
      </div>

      <div class="section-divider">SEO（可 AI 生成）</div>

      <div class="seo-head">
        <small class="muted">留空则自动用名称 / 简介 / 标签兜底。前台详情页会输出对应 meta 与结构化数据。</small>
        <button class="button button-ghost" type="button" :disabled="generating" @click="generateSeo">
          {{ generating ? 'AI 生成中…' : '✨ AI 生成 SEO' }}
        </button>
      </div>

      <div class="field">
        <label class="label">SEO 标题</label>
        <input class="input" v-model="form.seoTitle" placeholder="留空则用产品名称" />
      </div>

      <div class="field">
        <label class="label">SEO 描述</label>
        <textarea class="textarea" v-model="form.seoDescription" placeholder="留空则用一句话简介/项目简介"></textarea>
      </div>

      <div class="field">
        <label class="label">SEO 关键词（逗号分隔）</label>
        <input class="input" v-model="form.seoKeywords" placeholder="留空则用标签" />
      </div>

      <div class="field form-row">
        <label class="label">状态</label>
        <select class="select" v-model="form.status">
          <option value="draft">草稿</option>
          <option value="published">发布</option>
          <option value="archived">归档</option>
        </select>
      </div>

      <div class="field form-row">
        <label class="checkbox">
          <input type="checkbox" v-model="form.featured" />
          设为精选（首页顶部展示）
        </label>
      </div>

      <div class="field">
        <label class="label">排序值（越小越靠前）</label>
        <input class="input" type="number" v-model.number="form.sortOrder" style="max-width: 160px" />
      </div>

      <div class="field">
        <label class="label">定时发布</label>
        <input
          class="input"
          type="datetime-local"
          v-model="form.scheduledAt"
          style="max-width: 280px"
        />
        <small class="muted">留空则按上方状态发布；填入未来时间并保存为草稿后，到点自动发布。</small>
      </div>

      <button class="button button-primary" type="submit" :disabled="saving">
        {{ saving ? '保存中…' : '保存' }}
      </button>
    </form>

    <RevisionsPanel v-if="isEdit" type="product" :entity-id="id" />
    <TranslationsPanel v-if="isEdit" type="product" :entity-id="id" :fields="translationFields" />
  </div>
</template>

<style scoped>
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.form-row .label {
  margin: 0;
}

.form-row .select {
  max-width: 160px;
}

.muted {
  color: var(--text-muted);
  font-size: 12px;
}

.section-divider {
  margin: 24px 0 16px;
  padding-top: 18px;
  border-top: 1px solid var(--border);
  font-family: var(--mono);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-faint);
}

.seo-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
</style>