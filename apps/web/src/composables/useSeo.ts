import type { SiteConfig } from '@hyt/shared';

const SITE_NAME = 'HYT Studio';

/** 设置或移除一个 name 类型的 meta 标签（content 为空则移除） */
function setMeta(name: string, content?: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!content) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/** 设置或移除一个 property 类型的 meta 标签（OG / twitter） */
function setPropertyMeta(attr: 'property' | 'name', key: string, content?: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!content) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

const setOg = (property: string, content?: string) => setPropertyMeta('property', property, content);
const setTwitter = (name: string, content?: string) => setPropertyMeta('name', name, content);

/** 设置页面标题与描述（SEO / 分享卡片），由各页面按需调用 */
export function setSeo(title?: string, description?: string, keywords?: string) {
  document.title = title ? `${title} · ${SITE_NAME}` : SITE_NAME;
  if (description) {
    setMeta('description', description);
    setOg('og:description', description);
  }
  if (title) {
    setOg('og:title', `${title} · ${SITE_NAME}`);
  }
  setMeta('keywords', keywords);
  setOg('og:site_name', SITE_NAME);
  setOg('og:type', 'website');
}

/**
 * 注入 / 更新 JSON-LD 结构化数据（生成式引擎优化 GEO）。
 * 同一 id 的脚本会复用更新；data 为空则移除。
 */
export function setJsonLd(id: string, data?: Record<string, unknown>) {
  const scriptId = `jsonld-${id}`;
  let el = document.getElementById(scriptId) as HTMLScriptElement | null;
  if (!data) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement('script');
    el.id = scriptId;
    el.setAttribute('type', 'application/ld+json');
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

/**
 * 应用后台站点级 SEO / GEO 配置。
 * 在 App.vue 获取到 site-config 后调用一次，字段为空时自动移除对应 meta。
 */
export function applySiteSeo(cfg: Partial<SiteConfig>) {
  // 站点名称
  const name = cfg.siteName || SITE_NAME;
  setOg('og:site_name', name);
  setOg('og:type', 'website');

  // 关键词
  setMeta('keywords', cfg.seoKeywords);

  // robots 指令
  setMeta('robots', cfg.seoRobots);

  // OG 分享图
  setOg('og:image', cfg.seoOgImage);

  // Twitter 卡片
  if (cfg.seoOgImage || cfg.seoTwitter) {
    setTwitter('twitter:card', 'summary_large_image');
  } else {
    setTwitter('twitter:card', 'summary');
  }
  setTwitter('twitter:site', cfg.seoTwitter);
  setTwitter('twitter:image', cfg.seoOgImage);
}