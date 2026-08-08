<script setup lang="ts">
defineProps<{ lines?: number }>();
</script>

<template>
  <div class="skeleton-list">
    <div v-for="n in (lines || 3)" :key="n" class="skeleton-row">
      <div class="sk sk-icon"></div>
      <div class="sk-body">
        <div class="sk sk-line sk-title"></div>
        <div class="sk sk-line sk-desc"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.skeleton-list {
  display: flex;
  flex-direction: column;
}

.skeleton-row {
  display: flex;
  gap: 16px;
  padding: 22px 4px;
  border-bottom: 1px solid var(--line);
}

.sk-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  flex-shrink: 0;
}

.sk-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 4px;
}

.sk-line {
  height: 12px;
  border-radius: 6px;
}

.sk-title {
  width: 42%;
}

.sk-desc {
  width: 70%;
  height: 10px;
}

.sk {
  background: linear-gradient(90deg, var(--bg-muted) 25%, var(--bg-soft) 50%, var(--bg-muted) 75%);
  background-size: 200% 100%;
  animation: sk-shimmer 1.4s ease-in-out infinite;
}

@keyframes sk-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .sk {
    animation: none;
  }
}
</style>
