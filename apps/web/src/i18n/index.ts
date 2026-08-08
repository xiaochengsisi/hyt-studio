import { createI18n } from 'vue-i18n';
import zhCN from './locales/zh-CN';
import enUS from './locales/en-US';

export type AppLocale = 'zh-CN' | 'en-US';

const STORAGE_KEY = 'hyt-locale';

function detectLocale(): AppLocale {
  const saved = localStorage.getItem(STORAGE_KEY) as AppLocale | null;
  if (saved === 'zh-CN' || saved === 'en-US') return saved;
  // 按浏览器语言推断
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US';
}

export const i18n = createI18n({
  legacy: false,
  locale: detectLocale(),
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
  },
});

export function setLocale(locale: AppLocale): void {
  i18n.global.locale.value = locale;
  localStorage.setItem(STORAGE_KEY, locale);
  document.documentElement.lang = locale === 'zh-CN' ? 'zh-CN' : 'en';
}

export function getLocale(): AppLocale {
  return i18n.global.locale.value as AppLocale;
}
