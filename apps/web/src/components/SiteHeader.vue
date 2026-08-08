<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { setLocale, getLocale, type AppLocale } from '../i18n';
import { getResolvedTheme, toggleTheme, onThemeChange } from '../composables/useTheme';

defineProps<{ siteName: string }>();

const { t } = useI18n();
const current = computed(() => getLocale());
const theme = ref<'light' | 'dark'>('light');

function refreshTheme() {
  theme.value = getResolvedTheme();
}
onMounted(() => {
  refreshTheme();
  onThemeChange(refreshTheme);
});

function toggleLocale() {
  setLocale((current.value === 'zh-CN' ? 'en-US' : 'zh-CN') as AppLocale);
}

function onToggleTheme() {
  toggleTheme();
  refreshTheme();
}
</script>

<template>
  <header class="header">
    <div class="container header-inner">
      <router-link to="/" class="brand">
        <span class="brand-mark" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L21 6.5V12C21 16.5 17.5 20.5 12 22C6.5 20.5 3 16.5 3 12V6.5L12 2Z" fill="currentColor" />
          </svg>
        </span>
        <span class="brand-name">{{ siteName }}</span>
      </router-link>

      <nav class="nav">
        <router-link to="/products" class="nav-link">{{ t('nav.products') }}</router-link>
        <router-link to="/topics" class="nav-link">专题</router-link>
        <router-link to="/blog" class="nav-link">{{ t('nav.blog') }}</router-link>
        <router-link to="/team" class="nav-link">团队</router-link>
        <router-link to="/about" class="nav-link">{{ t('nav.about') }}</router-link>
        <router-link to="/submit" class="nav-link">{{ t('nav.submit') }}</router-link>
      </nav>

      <div class="header-actions">
        <button class="icon-toggle" :title="theme === 'dark' ? '切换到亮色' : '切换到暗色'" @click="onToggleTheme">
          <span v-if="theme === 'dark'">☀</span>
          <span v-else>☾</span>
        </button>
        <button class="lang-toggle" :title="t('lang.switch')" @click="toggleLocale">
          {{ current === 'zh-CN' ? 'EN' : '中' }}
        </button>
        <router-link to="/products" class="button button-primary btn-small">{{ t('nav.explore') }}</router-link>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: var(--header-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--line);
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  font-size: 17px;
  letter-spacing: -0.01em;
}

.brand-mark {
  width: 30px;
  height: 30px;
  border-radius: var(--radius);
  background: var(--ink);
  color: var(--bg);
  display: grid;
  place-items: center;
}

.brand-name {
  color: var(--text);
}

.nav {
  display: flex;
  align-items: center;
  gap: 2px;
}

.nav-link {
  padding: 8px 14px;
  color: var(--text-muted);
  font-weight: 500;
  font-size: 14.5px;
  border-radius: var(--radius);
  transition: color 0.15s ease, background 0.15s ease;
}

.nav-link:hover {
  color: var(--text);
  background: var(--bg-soft);
}

.nav-link.router-link-active {
  color: var(--accent);
}

.btn-small {
  padding: 9px 16px;
  font-size: 14px;
}

.lang-toggle,
.icon-toggle {
  width: 32px;
  height: 32px;
  border-radius: var(--radius);
  border: 1px solid var(--line);
  background: var(--bg);
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 700;
  font-family: var(--mono);
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: color 0.15s ease, border-color 0.15s ease;
}

.icon-toggle {
  font-size: 15px;
}

.lang-toggle:hover,
.icon-toggle:hover {
  color: var(--ink);
  border-color: var(--text-faint);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

@media (max-width: 640px) {
  .header-actions { display: none; }
  .nav-link { padding: 8px 10px; }
}
</style>
