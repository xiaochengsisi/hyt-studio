<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { api } from '../api/client';
import type { SiteConfig } from '@hyt/shared';
import { safeUrl } from '../utils/safe-url';
defineProps<{ site: SiteConfig }>();
const { t } = useI18n();

const email = ref('');
const state = ref<'idle' | 'loading' | 'done' | 'error'>('idle');
const message = ref('');

async function onSubscribe() {
  if (!email.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    state.value = 'error';
    message.value = '请输入有效的邮箱地址';
    return;
  }
  state.value = 'loading';
  message.value = '';
  try {
    const r = await api.subscribe(email.value);
    state.value = 'done';
    message.value = r.pending ? '确认邮件已发送，请查收点击确认。' : '你已订阅，感谢关注！';
    email.value = '';
  } catch (e: any) {
    state.value = 'error';
    message.value = e.message || '订阅失败';
  }
}
</script>

<template>
  <footer class="footer">
    <div class="container">
      <div class="footer-top">
        <div class="footer-brand">
          <span class="fb-mark" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L21 6.5V12C21 16.5 17.5 20.5 12 22C6.5 20.5 3 16.5 3 12V6.5L12 2Z" fill="#fff" opacity="0.95" />
              <path d="M8.5 12L11 14.5L15.5 10" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
          <div>
            <div class="fb-name">{{ site.siteName }}</div>
            <div class="fb-slogan">{{ site.slogan || 'Build open source, share the value.' }}</div>
          </div>
        </div>

        <div class="footer-col">
          <div class="f-head">{{ t('footer.site') }}</div>
          <router-link to="/products">{{ t('nav.products') }}</router-link>
          <router-link to="/blog">{{ t('nav.blog') }}</router-link>
          <router-link to="/about">{{ t('nav.about') }}</router-link>
        </div>

        <div class="footer-col">
          <div class="f-head">{{ t('footer.contact') }}</div>
          <a v-if="site.github" :href="safeUrl(site.github)" target="_blank" rel="noopener">GitHub ↗</a>
          <a v-if="site.email" :href="`mailto:${site.email}`">{{ site.email }}</a>
        </div>

        <div class="footer-col">
          <div class="f-head">订阅更新</div>
          <p class="ns-desc">新项目 / 新版本 / 新文章，第一时间送达。</p>
          <form class="ns-form" @submit.prevent="onSubscribe">
            <input
              type="email"
              class="ns-input"
              v-model="email"
              placeholder="you@example.com"
              :disabled="state === 'loading'"
            />
            <button class="ns-btn" type="submit" :disabled="state === 'loading'">
              {{ state === 'loading' ? '…' : '订阅' }}
            </button>
          </form>
          <div v-if="message" class="ns-msg" :class="state">{{ message }}</div>
        </div>
      </div>

      <div class="footer-bottom">
        <span>© {{ new Date().getFullYear() }} {{ site.siteName }}. {{ t('footer.rights') }}</span>
        <span>{{ t('footer.license') }}</span>
      </div>

      <div v-if="site.icp || site.policeRecord" class="footer-record">
        <a
          v-if="site.icp"
          href="https://beian.miit.gov.cn/"
          target="_blank"
          rel="noopener noreferrer"
          class="record-link"
        >{{ site.icp }}</a>
        <a
          v-if="site.policeRecord"
          href="http://www.beian.gov.cn/portal/registerSystemInfo"
          target="_blank"
          rel="noopener noreferrer"
          class="record-link"
        >
          <span class="record-badge" aria-hidden="true">公安</span>
          {{ site.policeRecord }}
        </a>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  border-top: 1px solid var(--border);
  background: var(--bg-soft);
  padding: 56px 0 28px;
}

.footer-top {
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr 1.4fr;
  gap: 40px;
  padding-bottom: 40px;
}

.footer-brand {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.fb-mark {
  width: 30px;
  height: 30px;
  border-radius: var(--radius);
  background: var(--ink);
  color: var(--bg);
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.fb-name {
  font-size: 18px;
  font-weight: 700;
}

.fb-slogan {
  color: var(--text-muted);
  font-size: 13.5px;
  margin-top: 4px;
}

.footer-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.f-head {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-faint);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 4px;
}

.footer-col a {
  color: var(--text-muted);
  font-size: 14.5px;
  width: fit-content;
  transition: color 0.15s ease;
}

.footer-col a:hover {
  color: var(--primary-strong);
}

.footer-bottom {
  border-top: 1px solid var(--border);
  padding-top: 20px;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 13px;
  color: var(--text-faint);
}

.footer-record {
  border-top: 1px solid var(--border);
  margin-top: 16px;
  padding-top: 16px;
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
  font-size: 12.5px;
}

.record-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-muted);
  transition: color 0.15s ease;
}

.record-link:hover {
  color: var(--ink);
}

.record-badge {
  display: inline-grid;
  place-items: center;
  width: 16px;
  height: 16px;
  border-radius: 2px;
  background: var(--ink);
  color: var(--bg);
  font-size: 9px;
  font-weight: 700;
  line-height: 1;
}

@media (max-width: 720px) {
  .footer-top {
    grid-template-columns: 1fr;
    gap: 28px;
  }
}

.ns-desc {
  color: var(--text-muted);
  font-size: 12.5px;
  margin: 0 0 10px;
  line-height: 1.5;
}

.ns-form {
  display: flex;
  gap: 6px;
}

.ns-input {
  flex: 1;
  min-width: 0;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg);
  color: var(--text);
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s ease;
}

.ns-input:focus {
  border-color: var(--accent);
}

.ns-btn {
  padding: 8px 14px;
  border: 0;
  border-radius: var(--radius-sm);
  background: var(--ink);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.ns-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.ns-msg {
  margin-top: 8px;
  font-size: 12px;
}

.ns-msg.done {
  color: #047857;
}

.ns-msg.error {
  color: #ef4444;
}
</style>