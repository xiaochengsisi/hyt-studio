<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { adminApi } from '../api/client';
import ImageUploader from '../components/ImageUploader.vue';
import type { SiteConfig } from '@hyt/shared';

const form = reactive<Partial<SiteConfig>>({
  siteName: '',
  slogan: '',
  description: '',
  siteUrl: '',
  logoUrl: '',
  github: '',
  email: '',
  twitter: '',
  icp: '',
  policeRecord: '',
  analyticsCode: '',
  seoKeywords: '',
  seoOgImage: '',
  seoRobots: '',
  seoTwitter: '',
  aiProvider: '',
  aiBaseUrl: '',
  aiApiKey: '',
  aiModel: '',
  giscusRepo: '',
  giscusRepoId: '',
  giscusCategory: '',
  giscusCategoryId: '',
});

const saving = ref(false);
const success = ref('');
const error = ref('');

/** AI 服务商预设，选择后自动填充接口地址与模型 */
const AI_PROVIDERS: { value: string; label: string; baseUrl: string; model: string }[] = [
  { value: 'deepseek', label: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  { value: 'zhipu', label: '智谱 GLM', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-flash' },
  { value: 'openai', label: 'OpenAI', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  { value: 'custom', label: '自定义', baseUrl: '', model: '' },
];

function onProviderChange() {
  const preset = AI_PROVIDERS.find((p) => p.value === form.aiProvider);
  if (preset && preset.value !== 'custom') {
    form.aiBaseUrl = preset.baseUrl;
    form.aiModel = preset.model;
  }
}

onMounted(async () => {
  const cfg = await adminApi.getSiteConfig();
  Object.assign(form, cfg);
});

async function onSubmit() {
  error.value = '';
  success.value = '';
  saving.value = true;
  try {
    await adminApi.updateSiteConfig(form);
    success.value = '站点设置已保存，请刷新前台查看效果';
  } catch (e: any) {
    error.value = e.message || '保存失败';
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div>
    <h1 class="page-title">站点设置</h1>
    <form class="card" @submit.prevent="onSubmit" style="max-width: 640px">
      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <div v-if="success" class="alert alert-success">{{ success }}</div>

      <div class="field">
        <label class="label">站点名称</label>
        <input class="input" v-model="form.siteName" />
      </div>

      <div class="field">
        <label class="label">Slogan</label>
        <input class="input" v-model="form.slogan" placeholder="Build open source, share the value." />
      </div>

      <div class="field">
        <label class="label">站点描述（SEO）</label>
        <textarea class="textarea" v-model="form.description"></textarea>
      </div>

      <div class="field">
        <label class="label">站点地址（用于 RSS/sitemap 的绝对链接）</label>
        <input class="input" v-model="form.siteUrl" placeholder="https://hyt.studio" />
      </div>

      <div class="field">
        <label class="label">Logo</label>
        <ImageUploader v-model="form.logoUrl" />
      </div>

      <div class="form-grid">
        <div class="field">
          <label class="label">GitHub</label>
          <input class="input" v-model="form.github" placeholder="https://github.com/..." />
        </div>
        <div class="field">
          <label class="label">邮箱</label>
          <input class="input" v-model="form.email" placeholder="hello@hyt.studio" />
        </div>
        <div class="field">
          <label class="label">Twitter / X</label>
          <input class="input" v-model="form.twitter" placeholder="https://twitter.com/..." />
        </div>
      </div>

      <div class="section-divider">备案与统计</div>

      <div class="form-grid">
        <div class="field">
          <label class="label">ICP 备案号</label>
          <input class="input" v-model="form.icp" placeholder="如：京ICP备12345678号" />
        </div>
        <div class="field">
          <label class="label">公安网备案号</label>
          <input class="input" v-model="form.policeRecord" placeholder="如：京公网安备11010802012345号" />
        </div>
      </div>

      <div class="field">
        <label class="label">统计代码</label>
        <textarea
          class="textarea"
          v-model="form.analyticsCode"
          placeholder="粘贴百度统计 / Google Analytics / Umami 等统计代码（script 标签原样插入页面）"
          style="min-height: 120px; font-family: var(--mono); font-size: 12.5px"
        ></textarea>
        <span class="field-hint">支持 &lt;script&gt; 标签，将原样插入前台页面 &lt;head&gt;。留空则不插入。</span>
      </div>

      <div class="section-divider">SEO 优化</div>

      <div class="field">
        <label class="label">关键词（Keywords）</label>
        <input
          class="input"
          v-model="form.seoKeywords"
          placeholder="开源程序, Web 工具, 网络工作室（逗号分隔）"
        />
        <span class="field-hint">写入 &lt;meta name="keywords"&gt;，多个关键词用逗号分隔。</span>
      </div>

      <div class="field">
        <label class="label">robots 指令</label>
        <input
          class="input"
          v-model="form.seoRobots"
          placeholder="index, follow"
        />
        <span class="field-hint">控制搜索引擎抓取行为，默认 index, follow。不想被收录可填 noindex, nofollow。</span>
      </div>

      <div class="field">
        <label class="label">OG 分享图（og:image）</label>
        <ImageUploader v-model="form.seoOgImage" />
        <span class="field-hint">分享到社交平台时显示的封面图，建议 1200×630。</span>
      </div>

      <div class="field">
        <label class="label">Twitter / X 账号（twitter:site）</label>
        <input
          class="input"
          v-model="form.seoTwitter"
          placeholder="@youraccount"
        />
        <span class="field-hint">以 @ 开头，用于 Twitter 卡片署名。留空则不输出。</span>
      </div>

      <div class="section-divider">AI SEO（生成式引擎优化）</div>

      <div class="field">
        <label class="label">AI 服务商</label>
        <select class="select" v-model="form.aiProvider" @change="onProviderChange">
          <option value="">未启用</option>
          <option v-for="p in AI_PROVIDERS" :key="p.value" :value="p.value">{{ p.label }}</option>
        </select>
        <span class="field-hint">选择后自动填充接口地址与模型，也可手动修改。在产品/文章编辑页用「AI 生成 SEO」按钮调用。</span>
      </div>

      <div class="form-grid">
        <div class="field">
          <label class="label">接口地址（OpenAI 兼容）</label>
          <input
            class="input"
            v-model="form.aiBaseUrl"
            placeholder="https://api.deepseek.com/v1"
          />
        </div>
        <div class="field">
          <label class="label">模型</label>
          <input
            class="input"
            v-model="form.aiModel"
            placeholder="deepseek-chat"
          />
        </div>
      </div>

      <div class="field">
        <label class="label">API Key</label>
        <input
          class="input"
          type="password"
          v-model="form.aiApiKey"
          placeholder="sk-..."
          autocomplete="off"
        />
        <span class="field-hint">仅后台可读，不会暴露给前台。留空表示不启用 AI 功能。</span>
      </div>

      <div class="section-divider">评论系统（Giscus · 基于 GitHub Discussions）</div>
      <span class="field-hint" style="display:block;margin-bottom:12px">
        在 <a href="https://giscus.app" target="_blank" rel="noopener">giscus.app</a> 填入仓库后获取以下配置。全部留空则不显示评论。
      </span>
      <div class="form-grid">
        <div class="field">
          <label class="label">仓库（owner/repo）</label>
          <input class="input" v-model="form.giscusRepo" placeholder="xiaochengsisi/hyt-studio" />
        </div>
        <div class="field">
          <label class="label">仓库 ID</label>
          <input class="input" v-model="form.giscusRepoId" placeholder="R_kgDO..." />
        </div>
        <div class="field">
          <label class="label">Discussion 分类</label>
          <input class="input" v-model="form.giscusCategory" placeholder="Announcements" />
        </div>
        <div class="field">
          <label class="label">分类 ID</label>
          <input class="input" v-model="form.giscusCategoryId" placeholder="DIC_kwDO..." />
        </div>
      </div>

      <button class="button button-primary" type="submit" :disabled="saving">
        {{ saving ? '保存中…' : '保存设置' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
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

.field-hint {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-faint);
}
</style>