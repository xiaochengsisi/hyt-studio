/**
 * 安全 URL 工具：过滤用户/管理员来源的 URL，仅放行 http(s)/mailto，
 * 防止 javascript:/data: 等协议经 v-bind:href 触发 XSS。
 * 返回 null 表示该 URL 不安全，模板中以 v-if 或空字符串兜底。
 */
export function safeUrl(url: string | undefined | null): string {
  if (!url) return '';
  const v = String(url).trim();
  if (v === '') return '';
  // 允许 http、https、mailto，以及同源的相对路径（/、# 开头）
  if (/^(https?:|mailto:)/i.test(v)) return v;
  if (v.startsWith('/') || v.startsWith('#')) return v;
  // 其余协议（javascript:、data:、vbscript:、file: 等）一律视为不安全，置空
  return '';
}
