<script setup lang="ts">
import { computed, ref } from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

const model = defineModel<string>({ default: '' });
const mode = ref<'edit' | 'preview'>('edit');

const html = computed(() =>
  DOMPurify.sanitize((marked.parse(model.value || '') as string) || '')
);
</script>

<template>
  <div class="md-editor">
    <div class="md-tabs">
      <button type="button" class="md-tab" :class="{ active: mode === 'edit' }" @click="mode = 'edit'">
        编辑
      </button>
      <button type="button" class="md-tab" :class="{ active: mode === 'preview' }" @click="mode = 'preview'">
        预览
      </button>
    </div>
    <textarea v-if="mode === 'edit'" v-model="model" class="textarea" style="min-height: 200px"></textarea>
    <div v-else class="md-preview markdown" v-html="html"></div>
  </div>
</template>

<style scoped>
.md-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
}

.md-tab {
  padding: 6px 14px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.md-tab.active {
  background: var(--primary-soft);
  color: var(--primary-strong);
  border-color: var(--primary);
}

.md-preview {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
  min-height: 200px;
  background: var(--bg);
}
</style>

<style>
.markdown {
  line-height: 1.85;
  color: var(--text-muted);
  font-size: 15px;
  word-break: break-word;
}
.markdown > *:first-child { margin-top: 0; }
.markdown > *:last-child { margin-bottom: 0; }
.markdown h1, .markdown h2, .markdown h3, .markdown h4 {
  color: var(--text);
  font-weight: 700;
  line-height: 1.3;
  margin: 1.5em 0 0.6em;
  letter-spacing: -0.01em;
}
.markdown h1 { font-size: 1.6em; }
.markdown h2 { font-size: 1.35em; padding-bottom: 0.3em; border-bottom: 1px solid var(--border); }
.markdown h3 { font-size: 1.15em; }
.markdown p { margin: 0.9em 0; }
.markdown a { color: var(--primary-strong); text-decoration: underline; text-underline-offset: 2px; }
.markdown ul, .markdown ol { margin: 0.9em 0; padding-left: 1.5em; }
.markdown li { margin: 0.35em 0; }
.markdown blockquote {
  margin: 1em 0; padding: 0.6em 1em;
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
.markdown pre { background: #0f172a; color: #e2e8f0; padding: 1em 1.1em; border-radius: 10px; overflow-x: auto; margin: 1em 0; }
.markdown pre code { background: transparent; border: none; padding: 0; color: inherit; font-size: 0.86em; }
.markdown table { width: 100%; border-collapse: collapse; margin: 1em 0; font-size: 0.92em; }
.markdown th, .markdown td { border: 1px solid var(--border); padding: 0.5em 0.8em; text-align: left; }
.markdown th { background: var(--bg-muted); font-weight: 600; }
.markdown hr { border: none; border-top: 1px solid var(--border); margin: 1.5em 0; }
</style>