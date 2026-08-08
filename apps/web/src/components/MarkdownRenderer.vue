<script setup lang="ts">
import { computed } from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { headingSlug } from '../utils/slug';

const props = defineProps<{ content: string }>();

const html = computed(() => {
  let raw = (marked.parse(props.content || '') as string) || '';
  // 为 h2/h3 注入 id 锚点（用于文章目录跳转），对同名标题自动去重
  const seen = new Map<string, number>();
  raw = raw.replace(/<(h[23])>([\s\S]*?)<\/\1>/g, (m, tag: string, inner: string) => {
    const text = inner.replace(/<[^>]+>/g, '').trim();
    let slug = headingSlug(text) || 'section';
    const count = seen.get(slug) || 0;
    seen.set(slug, count + 1);
    if (count > 0) slug = `${slug}-${count}`;
    return `<${tag} id="${slug}">${inner}</${tag}>`;
  });
  return DOMPurify.sanitize(raw);
});
</script>

<template>
  <div class="markdown" v-html="html"></div>
</template>

<style>
.markdown {
  line-height: 1.85;
  color: var(--text-muted);
  font-size: 15.5px;
  word-break: break-word;
}

.markdown > *:first-child {
  margin-top: 0;
}

.markdown > *:last-child {
  margin-bottom: 0;
}

.markdown h1,
.markdown h2,
.markdown h3,
.markdown h4 {
  color: var(--text);
  font-weight: 700;
  line-height: 1.3;
  margin: 1.6em 0 0.6em;
  letter-spacing: -0.01em;
}

.markdown h1 {
  font-size: 1.7em;
}

.markdown h2 {
  font-size: 1.4em;
  padding-bottom: 0.3em;
  border-bottom: 1px solid var(--border);
}

.markdown h3 {
  font-size: 1.2em;
}

.markdown p {
  margin: 0.9em 0;
}

.markdown a {
  color: var(--primary-strong);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.markdown a:hover {
  text-decoration-thickness: 2px;
}

.markdown ul,
.markdown ol {
  margin: 0.9em 0;
  padding-left: 1.5em;
}

.markdown li {
  margin: 0.35em 0;
}

.markdown blockquote {
  margin: 1em 0;
  padding: 0.6em 1em;
  border-left: 3px solid var(--primary);
  background: var(--primary-soft);
  border-radius: 0 8px 8px 0;
  color: var(--text);
}

.markdown code {
  font-family: var(--mono);
  font-size: 0.88em;
  background: var(--bg-muted);
  border: 1px solid var(--border);
  border-radius: 5px;
  padding: 0.15em 0.4em;
}

.markdown pre {
  background: #0f172a;
  color: #e2e8f0;
  padding: 1em 1.1em;
  border-radius: 10px;
  overflow-x: auto;
  margin: 1em 0;
}

.markdown pre code {
  background: transparent;
  border: none;
  padding: 0;
  color: inherit;
  font-size: 0.86em;
}

.markdown table {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
  font-size: 0.92em;
}

.markdown th,
.markdown td {
  border: 1px solid var(--border);
  padding: 0.5em 0.8em;
  text-align: left;
}

.markdown th {
  background: var(--bg-muted);
  font-weight: 600;
}

.markdown img {
  border-radius: 10px;
  margin: 1em 0;
}

.markdown hr {
  border: none;
  border-top: 1px solid var(--border);
  margin: 1.5em 0;
}
</style>