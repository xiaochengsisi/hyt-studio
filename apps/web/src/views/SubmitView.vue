<script setup lang="ts">
import { ref } from 'vue';
import { api } from '../api/client';

const form = ref({
  name: '',
  tagline: '',
  description: '',
  repoUrl: '',
  homepage: '',
  author: '',
  email: '',
});

const submitting = ref(false);
const error = ref('');
const success = ref('');

async function onSubmit() {
  error.value = '';
  success.value = '';
  submitting.value = true;
  try {
    await api.submitProject({
      name: form.value.name,
      tagline: form.value.tagline,
      description: form.value.description,
      repoUrl: form.value.repoUrl,
      homepage: form.value.homepage,
      author: form.value.author,
      email: form.value.email,
    });
    success.value = '提交成功！我们会尽快审核你的开源项目。';
    form.value = {
      name: '',
      tagline: '',
      description: '',
      repoUrl: '',
      homepage: '',
      author: '',
      email: '',
    };
  } catch (e: any) {
    error.value = e.message || '提交失败，请稍后再试';
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <section class="section">
    <div class="container submit">
      <div class="section-head" v-reveal>
        <span class="section-eyebrow">Submit a project</span>
        <h1 class="section-title">开源项目提交</h1>
        <p class="section-sub">
          如果你是开源项目的作者，欢迎提交你的作品。审核通过后，我们会将其收录到产品展示中。
        </p>
      </div>

      <div class="card form-card" v-reveal="'d-1'">
        <div v-if="error" class="alert alert-error">{{ error }}</div>
        <div v-if="success" class="alert alert-success">{{ success }}</div>

        <form @submit.prevent="onSubmit">
          <div class="form-grid">
            <div class="field">
              <label class="label">项目名称 *</label>
              <input class="input" v-model="form.name" required placeholder="例如：HYT Console" />
            </div>
            <div class="field">
              <label class="label">一句话简介</label>
              <input class="input" v-model="form.tagline" placeholder="用一句话描述这个项目" />
            </div>
            <div class="field field-full">
              <label class="label">项目介绍</label>
              <textarea class="input textarea" v-model="form.description" rows="4" placeholder="项目的功能、亮点与适用场景"></textarea>
            </div>
            <div class="field">
              <label class="label">仓库地址</label>
              <input class="input" v-model="form.repoUrl" type="url" placeholder="https://github.com/user/repo" />
            </div>
            <div class="field">
              <label class="label">项目主页</label>
              <input class="input" v-model="form.homepage" type="url" placeholder="https://example.com" />
            </div>
            <div class="field">
              <label class="label">你的称呼</label>
              <input class="input" v-model="form.author" placeholder="例如：HYT" />
            </div>
            <div class="field">
              <label class="label">联系邮箱</label>
              <input class="input" v-model="form.email" type="email" placeholder="用于反馈审核结果" />
            </div>
          </div>

          <div class="form-actions">
            <button class="button button-primary" type="submit" :disabled="submitting">
              {{ submitting ? '提交中…' : '提交项目' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<style scoped>
.submit {
  max-width: 720px;
}

.form-card {
  padding: 32px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-full {
  grid-column: 1 / -1;
}

.label {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-faint);
}

.input {
  padding: 11px 14px;
  border-radius: 10px;
  border: 1px solid var(--border-strong);
  background: var(--bg);
  color: var(--text);
  font-size: 14.5px;
  font-family: inherit;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-soft);
}

.textarea {
  resize: vertical;
  line-height: 1.6;
}

.form-actions {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}

.button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.alert {
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 14px;
  margin-bottom: 18px;
}

.alert-error {
  background: var(--danger-soft, #fef2f2);
  color: var(--danger, #dc2626);
  border: 1px solid rgba(220, 38, 38, 0.2);
}

.alert-success {
  background: var(--primary-soft);
  color: var(--primary-strong);
  border: 1px solid rgba(16, 185, 129, 0.2);
}

@media (max-width: 560px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  .field-full {
    grid-column: auto;
  }
}
</style>