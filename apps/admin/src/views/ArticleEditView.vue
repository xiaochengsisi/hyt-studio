<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { adminApi } from '../api/client';
import ImageUploader from '../components/ImageUploader.vue';
import MarkdownEditor from '../components/MarkdownEditor.vue';
import RevisionsPanel from '../components/RevisionsPanel.vue';
import TranslationsPanel from '../components/TranslationsPanel.vue';
import type { Article } from '@hyt/shared';

/** 文章可翻译字段定义 */
const translationFields = [
  { key: 'title', label: '标题' },
  { key: 'summary', label: '摘要', multiline: true },
  { key: 'content', label: '正文', multiline: true },
];

const route = useRoute();
const router = useRouter();
const isEdit = route.name === 'article-edit';
const id = Number(route.params.id);

// 是否已手动编辑过 slug（手动编辑后不再随标题自动更新）
const slugTouched = ref(isEdit);

const form = reactive<Partial<Article>>({
  title: '',
  slug: '',
  summary: '',
  content: '',
  coverUrl: '',
  tags: '',
  status: 'draft',
  scheduledAt: '',
  seoTitle: '',
  seoDescription: '',
  seoKeywords: '',
});

const saving = ref(false);
const generating = ref(false);
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
  () => form.title,
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
    const a = await adminApi.getArticle(id);
    Object.assign(form, a);
  }
});

async function onSubmit(publish = false) {
  error.value = '';
  success.value = '';
  saving.value = true;
  const payload = {
    ...form,
    status: publish ? 'published' : form.status,
    // 仅在显式发布时写入发布时间；存草稿时不回传该字段，避免 undefined 覆盖后端已有值
    ...(publish ? { publishedAt: new Date().toISOString() } : {}),
  };
  try {
    if (isEdit) {
      await adminApi.updateArticle(id, payload);
      success.value = '已保存';
    } else {
      await adminApi.createArticle(payload);
      router.push('/articles');
    }
  } catch (e: any) {
    error.value = e.message || '保存失败';
  } finally {
    saving.value = false;
  }
}

/** 用 AI 根据正文生成 SEO 标题/描述/关键词 */
async function generateSeo() {
  if (!form.title && !form.content) {
    error.value = '请先填写标题或正文后再生成 SEO';
    return;
  }
  error.value = '';
  success.value = '';
  generating.value = true;
  try {
    const res = await adminApi.generateSeo({
      type: 'article',
      name: form.title || '',
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
</script>

<template>
  <div>
    <div class="page-head">
      <h1 class="page-title">{{ isEdit ? '编辑文章' : '新建文章' }}</h1>
      <router-link to="/articles" class="button button-ghost">返回</router-link>
    </div>
    <form class="card" @submit.prevent="onSubmit()">
      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <div v-if="success" class="alert alert-success">{{ success }}</div>

      <div class="field">
        <label class="label">标题 *</label>
        <input class="input" v-model="form.title" required />
      </div>

      <div class="form-grid">
        <div class="field">
          <label class="label">Slug *</label>
          <input class="input" v-model="form.slug" placeholder="my-post" required />
          <small class="muted">根据标题自动生成；手动修改后将不再自动覆盖。</small>
        </div>
        <div class="field">
          <label class="label">标签（逗号分隔）</label>
          <input class="input" v-model="form.tags" placeholder="动态, 更新" />
        </div>
      </div>

      <div class="field">
        <label class="label">摘要</label>
        <textarea class="textarea" v-model="form.summary"></textarea>
      </div>

      <div class="field">
        <label class="label">封面</label>
        <ImageUploader v-model="form.coverUrl" />
      </div>

      <div class="field">
        <label class="label">正文（支持 Markdown）</label>
        <MarkdownEditor v-model="form.content" />
      </div>

      <div class="section-divider">SEO（可 AI 生成）</div>

      <div class="seo-head">
        <small class="muted">留空则自动用标题 / 摘要 / 标签兜底。前台详情页会输出对应 meta 与结构化数据。</small>
        <button class="button button-ghost" type="button" :disabled="generating" @click="generateSeo">
          {{ generating ? 'AI 生成中…' : '✨ AI 生成 SEO' }}
        </button>
      </div>

      <div class="field">
        <label class="label">SEO 标题</label>
        <input class="input" v-model="form.seoTitle" placeholder="留空则用文章标题" />
      </div>

      <div class="field">
        <label class="label">SEO 描述</label>
        <textarea class="textarea" v-model="form.seoDescription" placeholder="留空则用摘要"></textarea>
      </div>

      <div class="field">
        <label class="label">SEO 关键词（逗号分隔）</label>
        <input class="input" v-model="form.seoKeywords" placeholder="留空则用标签" />
      </div>

      <div class="field">
        <label class="label">定时发布</label>
        <input
          class="input"
          type="datetime-local"
          v-model="form.scheduledAt"
          style="max-width: 280px"
        />
        <small class="muted">留空则按上方按钮发布；填入未来时间并保存为草稿后，到点自动发布。</small>
      </div>

      <div class="btn-row">
        <button class="button button-primary" type="submit" :disabled="saving">
          {{ saving ? '保存中…' : '存为草稿' }}
        </button>
        <button class="button button-ghost" type="button" :disabled="saving" @click="onSubmit(true)">
          {{ saving ? '发布中…' : '发布' }}
        </button>
      </div>
    </form>

    <RevisionsPanel v-if="isEdit" type="article" :entity-id="id" />
    <TranslationsPanel v-if="isEdit" type="article" :entity-id="id" :fields="translationFields" />
  </div>
</template>

<style scoped>
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.btn-row {
  display: flex;
  gap: 12px;
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