<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { adminApi } from '../api/client';
import type { PageContent } from '@hyt/shared';

const TONES = ['green', 'cyan', 'violet', 'amber'];

const emptyContent = (): PageContent => ({
  hero: { badge: '', titleLine1: '', titleLine2: '', subtitle: '', ctaPrimary: '', ctaSecondary: '' },
  features: { eyebrow: '', title: '', subtitle: '', items: [] },
  stats: [],
  cta: { title: '', subtitle: '', primary: '', secondary: '' },
  projects: { featuredEyebrow: '', featuredTitle: '', featuredSub: '', allEyebrow: '', allTitle: '', allSub: '', viewAll: '' },
  about: { eyebrow: '', title: '', introTitle: '', introText: '', values: [], contactTitle: '' },
});

const form = reactive<PageContent>(emptyContent());
const saving = ref(false);
const success = ref('');
const error = ref('');

onMounted(async () => {
  const cfg = await adminApi.getSiteConfig();
  const c = cfg.content;
  if (c) {
    Object.assign(form, {
      hero: { ...emptyContent().hero, ...c.hero },
      features: { ...emptyContent().features, ...c.features, items: c.features?.items || [] },
      stats: c.stats || [],
      cta: { ...emptyContent().cta, ...c.cta },
      projects: { ...emptyContent().projects, ...c.projects },
      about: {
        ...emptyContent().about,
        ...c.about,
        values: c.about?.values || [],
      },
    });
  }
});

async function onSubmit() {
  error.value = '';
  success.value = '';
  saving.value = true;
  try {
    await adminApi.updateSiteConfig({ content: form });
    success.value = '页面内容已保存，刷新前台即可生效';
  } catch (e: any) {
    error.value = e.message || '保存失败';
  } finally {
    saving.value = false;
  }
}

function addFeature() {
  form.features.items.push({ icon: 'S', title: '', desc: '', tone: 'green' });
}
function rmFeature(i: number) {
  form.features.items.splice(i, 1);
}
function addStat() {
  form.stats.push({ value: '', label: '' });
}
function rmStat(i: number) {
  form.stats.splice(i, 1);
}
function addValue() {
  form.about.values.push({ icon: 'S', title: '', desc: '', tone: 'green' });
}
function rmValue(i: number) {
  form.about.values.splice(i, 1);
}
</script>

<template>
  <div>
    <div class="page-head">
      <h1 class="page-title">页面内容</h1>
      <button class="button button-primary" :disabled="saving" @click="onSubmit">
        {{ saving ? '保存中…' : '保存全部' }}
      </button>
    </div>

    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <div v-if="success" class="alert alert-success">{{ success }}</div>

    <form @submit.prevent="onSubmit">
      <!-- HERO -->
      <section class="card block">
        <h3 class="card-title">首页 HERO</h3>
        <div class="grid-2">
          <div class="field"><label class="label">徽章文案</label><input class="input" v-model="form.hero.badge" /></div>
          <div class="field"><label class="label">标题第一行</label><input class="input" v-model="form.hero.titleLine1" /></div>
          <div class="field"><label class="label">标题第二行（渐变高亮）</label><input class="input" v-model="form.hero.titleLine2" /></div>
          <div class="field"><label class="label">主按钮文字</label><input class="input" v-model="form.hero.ctaPrimary" /></div>
        </div>
        <div class="field"><label class="label">副标题</label><textarea class="textarea" v-model="form.hero.subtitle" rows="2"></textarea></div>
        <div class="grid-2">
          <div class="field"><label class="label">次按钮文字</label><input class="input" v-model="form.hero.ctaSecondary" /></div>
        </div>
      </section>

      <!-- FEATURES -->
      <section class="card block">
        <h3 class="card-title">首页「理念」区块</h3>
        <div class="grid-3">
          <div class="field"><label class="label">Eyebrow</label><input class="input" v-model="form.features.eyebrow" /></div>
          <div class="field"><label class="label">标题</label><input class="input" v-model="form.features.title" /></div>
          <div class="field"><label class="label">副标题</label><input class="input" v-model="form.features.subtitle" /></div>
        </div>

        <div class="list-head">
          <span class="card-sub">特性卡片（{{ form.features.items.length }}）</span>
          <button type="button" class="button button-ghost" @click="addFeature">+ add</button>
        </div>
        <div v-for="(f, i) in form.features.items" :key="i" class="list-item">
          <div class="grid-4">
            <div class="field"><label class="label">图标字母</label><input class="input" v-model="f.icon" maxlength="1" /></div>
            <div class="field"><label class="label">标题</label><input class="input" v-model="f.title" /></div>
            <div class="field">
              <label class="label">色调</label>
              <select class="input" v-model="f.tone">
                <option v-for="t in TONES" :key="t" :value="t">{{ t }}</option>
              </select>
            </div>
            <div class="field"><label class="label">描述</label><input class="input" v-model="f.desc" /></div>
          </div>
          <button type="button" class="button button-danger rm" @click="rmFeature(i)">删除</button>
        </div>
      </section>

      <!-- STATS -->
      <section class="card block">
        <h3 class="card-title">首页数据条</h3>
        <div class="list-head">
          <span class="card-sub">数据项（{{ form.stats.length }}）—— 第一个「开源项目」默认取产品数量</span>
          <button type="button" class="button button-ghost" @click="addStat">+ add</button>
        </div>
        <div v-for="(s, i) in form.stats" :key="i" class="list-item">
          <div class="grid-2">
            <div class="field"><label class="label">数值（如 100% / MIT / ∞；留空则自动显示产品数）</label><input class="input" v-model="s.value" /></div>
            <div class="field"><label class="label">标签</label><input class="input" v-model="s.label" /></div>
          </div>
          <button type="button" class="button button-danger rm" @click="rmStat(i)">删除</button>
        </div>
      </section>

      <!-- CTA -->
      <section class="card block">
        <h3 class="card-title">首页 CTA</h3>
        <div class="grid-2">
          <div class="field"><label class="label">标题</label><input class="input" v-model="form.cta.title" /></div>
          <div class="field"><label class="label">副标题</label><input class="input" v-model="form.cta.subtitle" /></div>
          <div class="field"><label class="label">主按钮</label><input class="input" v-model="form.cta.primary" /></div>
          <div class="field"><label class="label">次按钮</label><input class="input" v-model="form.cta.secondary" /></div>
        </div>
      </section>

      <!-- PROJECTS -->
      <section class="card block">
        <h3 class="card-title">首页「项目」区块</h3>
        <div class="grid-2">
          <div class="field"><label class="label">精选 · Eyebrow</label><input class="input" v-model="form.projects.featuredEyebrow" /></div>
          <div class="field"><label class="label">精选 · 标题</label><input class="input" v-model="form.projects.featuredTitle" /></div>
          <div class="field"><label class="label">精选 · 副标题</label><input class="input" v-model="form.projects.featuredSub" /></div>
          <div class="field"><label class="label">更多 · Eyebrow</label><input class="input" v-model="form.projects.allEyebrow" /></div>
          <div class="field"><label class="label">更多 · 标题</label><input class="input" v-model="form.projects.allTitle" /></div>
          <div class="field"><label class="label">更多 · 副标题</label><input class="input" v-model="form.projects.allSub" /></div>
          <div class="field"><label class="label">「查看全部」按钮</label><input class="input" v-model="form.projects.viewAll" /></div>
        </div>
      </section>

      <!-- ABOUT -->
      <section class="card block">
        <h3 class="card-title">关于页</h3>
        <div class="grid-3">
          <div class="field"><label class="label">Eyebrow</label><input class="input" v-model="form.about.eyebrow" /></div>
          <div class="field"><label class="label">标题</label><input class="input" v-model="form.about.title" /></div>
          <div class="field"><label class="label">联系标题</label><input class="input" v-model="form.about.contactTitle" /></div>
        </div>
        <div class="grid-2">
          <div class="field"><label class="label">「我们是谁」标题</label><input class="input" v-model="form.about.introTitle" /></div>
        </div>
        <div class="field"><label class="label">「我们是谁」正文</label><textarea class="textarea" v-model="form.about.introText" rows="4"></textarea></div>

        <div class="list-head">
          <span class="card-sub">价值观卡片（{{ form.about.values.length }}）</span>
          <button type="button" class="button button-ghost" @click="addValue">+ add</button>
        </div>
        <div v-for="(v, i) in form.about.values" :key="i" class="list-item">
          <div class="grid-4">
            <div class="field"><label class="label">图标字母</label><input class="input" v-model="v.icon" maxlength="1" /></div>
            <div class="field"><label class="label">标题</label><input class="input" v-model="v.title" /></div>
            <div class="field">
              <label class="label">色调</label>
              <select class="input" v-model="v.tone">
                <option v-for="t in TONES" :key="t" :value="t">{{ t }}</option>
              </select>
            </div>
            <div class="field"><label class="label">描述</label><input class="input" v-model="v.desc" /></div>
          </div>
          <button type="button" class="button button-danger rm" @click="rmValue(i)">删除</button>
        </div>
      </section>

      <div class="save-bar">
        <button class="button button-primary" type="submit" :disabled="saving">
          {{ saving ? '保存中…' : '保存全部' }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.block {
  margin-bottom: 16px;
}

.card-title {
  margin: 0 0 16px;
  font-size: 16px;
}

.card-sub {
  color: var(--text-muted);
  font-size: 13px;
}

.list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 18px 0 10px;
  padding-top: 14px;
  border-top: 1px solid var(--border);
}

.list-item {
  position: relative;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 10px;
  background: var(--bg-soft);
}

.list-item .rm {
  position: absolute;
  top: 12px;
  right: 12px;
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.grid-3 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px;
}

.grid-4 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  padding-right: 60px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.label {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-muted);
}

.input,
.textarea {
  width: 100%;
  padding: 9px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg);
  font-size: 14px;
  outline: none;
  font-family: inherit;
}

.textarea {
  resize: vertical;
  line-height: 1.6;
}

.input:focus,
.textarea:focus {
  border-color: var(--primary);
}

.save-bar {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 640px) {
  .grid-2,
  .grid-4 {
    grid-template-columns: 1fr;
  }
}
</style>