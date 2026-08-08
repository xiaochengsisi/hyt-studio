<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Product } from '@hyt/shared';

const props = defineProps<{ product: Product }>();

interface Cmd {
  label: string;
  cmd: string;
}

/** 根据 repoUrl / language / homepage 推断可用的安装命令 */
const commands = computed<Cmd[]>(() => {
  const list: Cmd[] = [];
  const p = props.product;
  // git clone：有仓库地址时始终给出
  if (p.repoUrl) {
    const url = p.repoUrl.replace(/\.git$/, '');
    list.push({ label: 'git', cmd: `git clone ${url}.git` });
  }
  // 根据语言推断包管理命令
  const lang = (p.language || '').toLowerCase();
  const name = p.slug;
  if (lang === 'rust') {
    list.push({ label: 'cargo', cmd: `cargo install ${name}` });
  } else if (lang === 'python') {
    list.push({ label: 'pip', cmd: `pip install ${name}` });
  } else if (lang === 'go') {
    list.push({ label: 'go', cmd: `go install github.com/yourorg/${name}@latest` });
  } else if (lang === 'javascript' || lang === 'typescript' || lang === 'node') {
    list.push({ label: 'npm', cmd: `npm install ${name}` });
    list.push({ label: 'pnpm', cmd: `pnpm add ${name}` });
  }
  // 无仓库也无语言命令时，回退到 homepage 访问提示
  if (!list.length && p.homepage) {
    list.push({ label: 'open', cmd: p.homepage });
  }
  return list;
});

const active = ref(0);
const copied = ref(false);

async function copy(cmd: string) {
  try {
    await navigator.clipboard.writeText(cmd);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1500);
  } catch {
    /* ignore */
  }
}
</script>

<template>
  <div v-if="commands.length" class="install-card card">
    <div class="install-head">
      <span class="install-label">安装 / 获取</span>
      <div class="tabs">
        <button
          v-for="(c, i) in commands"
          :key="c.label"
          class="tab"
          :class="{ active: active === i }"
          @click="active = i"
        >{{ c.label }}</button>
      </div>
    </div>
    <div class="install-cmd">
      <code class="cmd-text">{{ commands[active].cmd }}</code>
      <button class="copy-btn" :class="{ copied }" @click="copy(commands[active].cmd)">
        {{ copied ? '已复制' : '复制' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.install-card {
  padding: 18px 22px;
  margin-bottom: 20px;
}

.install-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.install-label {
  font-family: var(--mono);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-faint);
}

.tabs {
  display: flex;
  gap: 4px;
}

.tab {
  padding: 4px 10px;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--text-muted);
  background: transparent;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}

.tab:hover {
  color: var(--text);
  border-color: var(--line-strong);
}

.tab.active {
  color: var(--bg);
  background: var(--ink);
  border-color: var(--ink);
}

.install-cmd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: var(--bg-soft);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 10px 14px;
}

.cmd-text {
  font-family: var(--mono);
  font-size: 13.5px;
  color: var(--text);
  word-break: break-all;
  white-space: pre-wrap;
}

.copy-btn {
  flex-shrink: 0;
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 600;
  font-family: var(--mono);
  color: var(--text-muted);
  background: var(--bg);
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease;
}

.copy-btn:hover {
  color: var(--ink);
  border-color: var(--text-faint);
}

.copy-btn.copied {
  color: var(--accent);
  border-color: var(--accent);
}
</style>
