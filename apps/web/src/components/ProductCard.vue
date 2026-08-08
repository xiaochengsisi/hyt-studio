<script setup lang="ts">
import type { Product } from '@hyt/shared';

defineProps<{ product: Product }>();

function tagsList(tags?: string): string[] {
  return (tags || '').split(',').map((t) => t.trim()).filter(Boolean).slice(0, 4);
}

function letterFor(name: string): string {
  return (name.charAt(0) || 'P').toUpperCase();
}
</script>

<template>
  <router-link :to="`/products/${product.slug}`" class="product-card">
    <div class="pc-head">
      <div class="icon-tile">{{ letterFor(product.name) }}</div>
      <span class="pc-ver mono">v{{ product.version || '—' }}</span>
    </div>

    <h3 class="pc-name">{{ product.name }}</h3>
    <p class="pc-desc">{{ product.tagline }}</p>

    <div class="pc-tags">
      <span v-for="t in tagsList(product.tags)" :key="t" class="tag">{{ t }}</span>
    </div>

    <div class="pc-foot">
      <span class="pc-link">查看项目</span>
      <span class="pc-arrow">→</span>
    </div>
  </router-link>
</template>

<style scoped>
.product-card {
  display: flex;
  flex-direction: column;
  min-height: 220px;
  padding: 24px;
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  transition: border-color 0.2s ease, background 0.2s ease;
}

.product-card:hover {
  border-color: var(--ink);
  background: var(--bg-soft);
}

.pc-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.pc-ver {
  font-size: 12px;
  color: var(--text-faint);
}

.pc-name {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin: 0 0 8px;
}

.product-card:hover .pc-name {
  color: var(--accent);
}

.pc-desc {
  color: var(--text-muted);
  font-size: 14.5px;
  line-height: 1.7;
  margin: 0 0 16px;
}

.pc-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 20px;
}

.pc-foot {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid var(--line);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pc-link {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--ink);
}

.pc-arrow {
  color: var(--text-faint);
  transition: transform 0.18s ease, color 0.18s ease;
}

.product-card:hover .pc-arrow {
  transform: translateX(4px);
  color: var(--accent);
}
</style>