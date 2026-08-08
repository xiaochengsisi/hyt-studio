/**
 * 将标题文本转为 HTML id 锚点（保留中文，便于中文文章目录跳转）。
 * 标签会被剥离，空格转连字符，非法字符剔除。
 */
export function headingSlug(text: string): string {
  return (text || '')
    .replace(/<[^>]+>/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\u4e00-\u9fff\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
