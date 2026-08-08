/**
 * 主题切换：light / dark / system。
 * - 优先读取 localStorage('hyt_theme')，缺省跟随系统 prefers-color-scheme
 * - 选择写入 <html data-theme="...">，CSS 变量在 style.css 中定义
 * - 系统主题变化时，若用户未显式选择则跟随
 */
export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'hyt_theme';

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false;
}

function apply(mode: ThemeMode): 'light' | 'dark' {
  const resolved = mode === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : mode;
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', resolved);
  }
  return resolved;
}

let mql: MediaQueryList | null = null;
let listeners = new Set<(resolved: 'light' | 'dark') => void>();

/** 初始化主题：读取偏好并监听系统变化。在 App.vue onMounted 调用一次。 */
export function initTheme(): 'light' | 'dark' {
  const stored = (localStorage.getItem(STORAGE_KEY) as ThemeMode | null) || 'system';
  const resolved = apply(stored);
  if (window.matchMedia) {
    mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const cur = (localStorage.getItem(STORAGE_KEY) as ThemeMode | null) || 'system';
      if (cur === 'system') {
        const r = apply('system');
        listeners.forEach((fn) => fn(r));
      }
    };
    mql.addEventListener('change', handler);
  }
  return resolved;
}

/** 当前用户选择的模式（light / dark / system）。 */
export function getThemeMode(): ThemeMode {
  return (localStorage.getItem(STORAGE_KEY) as ThemeMode | null) || 'system';
}

/** 当前实际生效的主题。 */
export function getResolvedTheme(): 'light' | 'dark' {
  const mode = getThemeMode();
  return mode === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : mode;
}

/** 设置主题模式并持久化。 */
export function setThemeMode(mode: ThemeMode): 'light' | 'dark' {
  localStorage.setItem(STORAGE_KEY, mode);
  const resolved = apply(mode);
  listeners.forEach((fn) => fn(resolved));
  return resolved;
}

/** 在 light / dark 间显式切换（system 视为当前 resolved 的反值）。 */
export function toggleTheme(): 'light' | 'dark' {
  const cur = getResolvedTheme();
  return setThemeMode(cur === 'dark' ? 'light' : 'dark');
}

/** 订阅主题变化，返回取消订阅函数。 */
export function onThemeChange(fn: (resolved: 'light' | 'dark') => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
