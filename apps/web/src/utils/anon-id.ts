const ANON_ID_KEY = 'hyt_anon_id';

/** 获取/生成浏览器匿名 ID（localStorage 持久化），用于点赞去重 */
export function getAnonId(): string {
  let id = localStorage.getItem(ANON_ID_KEY);
  if (!id) {
    id =
      crypto.randomUUID?.() ||
      `anon-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(ANON_ID_KEY, id);
  }
  return id;
}

/** 记录已点赞的产品 slug（localStorage，用于前端展示点赞状态） */
const LIKED_KEY = 'hyt_liked_slugs';

export function getLikedSlugs(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(LIKED_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

export function setLiked(slug: string, liked: boolean) {
  const set = getLikedSlugs();
  if (liked) set.add(slug);
  else set.delete(slug);
  localStorage.setItem(LIKED_KEY, JSON.stringify([...set]));
}

/** 格式化数字：1200 → 1.2k */
export function fmtCount(n: number): string {
  if (!n) return '0';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(n);
}
