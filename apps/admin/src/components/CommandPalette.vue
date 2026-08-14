<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { logout } from '../stores/auth';

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>();

const router = useRouter();
const open = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});
const query = ref('');
const activeIndex = ref(0);
const inputEl = ref<HTMLInputElement | null>(null);

interface Cmd {
  label: string;
  hint?: string;
  to?: string;
  action?: () => void;
  group: string;
}

const commands = computed<Cmd[]>(() => [
  // 导航
  { label: '仪表盘', to: '/', group: '导航' },
  { label: '产品列表', to: '/products', group: '导航' },
  { label: '文章列表', to: '/articles', group: '导航' },
  { label: '专题', to: '/topics', group: '导航' },
  { label: '提交审核', to: '/submissions', group: '导航' },
  { label: '媒体库', to: '/media', group: '导航' },
  { label: '订阅者', to: '/subscribers', group: '导航' },
  { label: '页面内容', to: '/content', group: '导航' },
  { label: '团队成员', to: '/members', group: '导航' },
  { label: '审计日志', to: '/audit-log', group: '导航' },
  { label: '用户管理', to: '/users', group: '导航' },
  { label: '站点设置', to: '/settings', group: '导航' },
  { label: '数据备份', to: '/backup', group: '导航' },
  // 创建
  { label: '新建产品', to: '/products/new', group: '创建' },
  { label: '新建文章', to: '/articles/new', group: '创建' },
  // 操作
  {
    label: '导出全站备份',
    group: '操作',
    action: () => {
      window.open('/api/backup/export', '_blank');
    },
  },
  {
    label: '退出登录',
    group: '操作',
    action: async () => {
      await logout();
      window.location.href = '/login';
    },
  },
]);

const filtered = computed<Cmd[]>(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return commands.value;
  return commands.value.filter((c) => c.label.toLowerCase().includes(q));
});

// 按 group 分组
const grouped = computed(() => {
  const map = new Map<string, Cmd[]>();
  for (const c of filtered.value) {
    if (!map.has(c.group)) map.set(c.group, []);
    map.get(c.group)!.push(c);
  }
  return Array.from(map.entries());
});

function onKeyDown(e: KeyboardEvent) {
  // ⌘K / Ctrl+K 唤出
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    open.value = !open.value;
    return;
  }
  if (!open.value) return;
  if (e.key === 'Escape') {
    open.value = false;
    return;
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    activeIndex.value = Math.min(activeIndex.value + 1, filtered.value.length - 1);
    return;
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    activeIndex.value = Math.max(activeIndex.value - 1, 0);
    return;
  }
  if (e.key === 'Enter') {
    e.preventDefault();
    const cmd = filtered.value[activeIndex.value];
    if (cmd) runCommand(cmd);
  }
}

function runCommand(cmd: Cmd) {
  open.value = false;
  query.value = '';
  activeIndex.value = 0;
  if (cmd.to) router.push(cmd.to);
  else if (cmd.action) cmd.action();
}

watch(open, (v) => {
  if (v) {
    query.value = '';
    activeIndex.value = 0;
    nextTick(() => inputEl.value?.focus());
  }
});

watch(query, () => {
  activeIndex.value = 0;
});

onMounted(() => window.addEventListener('keydown', onKeyDown));
onUnmounted(() => window.removeEventListener('keydown', onKeyDown));
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="cmd-mask" @click.self="open = false">
      <div class="cmd-box">
        <div class="cmd-input-row">
          <span class="cmd-icon">⌘</span>
          <input
            ref="inputEl"
            class="cmd-input"
            v-model="query"
            placeholder="输入命令或页面名…"
            autocomplete="off"
            spellcheck="false"
          />
          <kbd class="cmd-esc">ESC</kbd>
        </div>

        <div v-if="!filtered.length" class="cmd-empty">无匹配命令</div>
        <div v-else class="cmd-list">
          <template v-for="[group, items] in grouped" :key="group">
            <div class="cmd-group">{{ group }}</div>
            <button
              v-for="cmd in items"
              :key="cmd.label"
              class="cmd-item"
              :class="{ active: filtered[activeIndex] === cmd }"
              @mouseenter="activeIndex = filtered.indexOf(cmd)"
              @click="runCommand(cmd)"
            >
              <span class="cmd-label">{{ cmd.label }}</span>
              <span v-if="cmd.hint" class="cmd-hint">{{ cmd.hint }}</span>
              <span v-if="cmd.to" class="cmd-arrow">↵</span>
            </button>
          </template>
        </div>
        <div class="cmd-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> 选择</span>
          <span><kbd>↵</kbd> 执行</span>
          <span><kbd>ESC</kbd> 关闭</span>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.cmd-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 12vh;
  z-index: 1000;
}

.cmd-box {
  width: 100%;
  max-width: 560px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  margin: 0 16px;
}

.cmd-input-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
}

.cmd-icon {
  color: var(--text-faint);
  font-size: 14px;
}

.cmd-input {
  flex: 1;
  border: 0;
  outline: none;
  background: transparent;
  font-size: 15px;
  color: var(--text);
}

.cmd-esc {
  font-family: var(--mono);
  font-size: 10px;
  background: var(--bg-soft);
  color: var(--text-faint);
  padding: 2px 6px;
  border-radius: 4px;
}

.cmd-list {
  max-height: 360px;
  overflow-y: auto;
  padding: 6px 0;
}

.cmd-group {
  padding: 8px 16px 4px;
  font-family: var(--mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-faint);
}

.cmd-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 16px;
  background: transparent;
  border: 0;
  cursor: pointer;
  font-size: 13.5px;
  color: var(--text);
  text-align: left;
}

.cmd-item.active {
  background: var(--bg-soft);
}

.cmd-label {
  flex: 1;
}

.cmd-hint {
  color: var(--text-faint);
  font-size: 11px;
}

.cmd-arrow {
  color: var(--text-faint);
  font-size: 12px;
}

.cmd-empty {
  padding: 30px;
  text-align: center;
  color: var(--text-faint);
  font-size: 13px;
}

.cmd-footer {
  display: flex;
  gap: 16px;
  padding: 10px 16px;
  border-top: 1px solid var(--border);
  font-size: 11px;
  color: var(--text-faint);
}

.cmd-footer kbd {
  display: inline-block;
  background: var(--bg-soft);
  padding: 1px 5px;
  border-radius: 3px;
  margin-right: 3px;
  font-family: var(--mono);
  font-size: 10px;
}
</style>
