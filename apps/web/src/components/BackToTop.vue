<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';

const visible = ref(false);

function onScroll() {
  visible.value = window.scrollY > 600;
}

function toTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }));
onUnmounted(() => window.removeEventListener('scroll', onScroll));
</script>

<template>
  <transition name="fade">
    <button v-if="visible" class="back-to-top" aria-label="回到顶部" @click="toTop">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  </transition>
</template>

<style scoped>
.back-to-top {
  position: fixed;
  right: 28px;
  bottom: 28px;
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  background: var(--bg);
  color: var(--ink);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.1);
  cursor: pointer;
  z-index: 40;
  transition: color 0.15s ease, border-color 0.15s ease;
}

.back-to-top:hover {
  color: var(--accent);
  border-color: var(--accent);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
