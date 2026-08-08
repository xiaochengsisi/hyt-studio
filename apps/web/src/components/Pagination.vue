<script setup lang="ts">
const props = defineProps<{ page: number; pageSize: number; total: number }>();
const emit = defineEmits<{ (e: 'change', page: number): void }>();

const totalPages = () => Math.max(1, Math.ceil((props.total || 0) / (props.pageSize || 1)));

function go(p: number) {
  if (p < 1 || p > totalPages()) return;
  emit('change', p);
}
</script>

<template>
  <nav v-if="totalPages() > 1" class="pagination">
    <button class="page-btn" :disabled="page <= 1" @click="go(page - 1)">‹</button>
    <button
      v-for="p in totalPages()"
      :key="p"
      class="page-btn"
      :class="{ active: p === page }"
      @click="go(p)"
    >
      {{ p }}
    </button>
    <button class="page-btn" :disabled="page >= totalPages()" @click="go(page + 1)">›</button>
  </nav>
</template>

<style scoped>
.pagination {
  display: flex;
  gap: 6px;
  justify-content: center;
  margin-top: 32px;
}

.page-btn {
  min-width: 34px;
  height: 34px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text-muted);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.page-btn:hover:not(:disabled) {
  border-color: var(--primary);
  color: var(--primary-strong);
}

.page-btn.active {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>