<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { setSeo } from '../composables/useSeo';
const { t } = useI18n();
setSeo(t('notFound.title'), t('notFound.desc'));
</script>

<template>
  <section class="not-found container">
    <div class="nf-code">{{ t('notFound.code') }}</div>
    <h1 class="nf-title">{{ t('notFound.title') }}</h1>
    <p class="nf-desc">{{ t('notFound.desc') }}</p>
    <div class="nf-actions">
      <router-link to="/" class="nf-link">{{ t('notFound.home') }}</router-link>
      <router-link to="/products" class="nf-link muted">{{ t('notFound.browse') }}</router-link>
    </div>
  </section>
</template>

<style scoped>
.not-found {
  min-height: 56vh;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  padding: 72px 0;
}

.nf-code {
  font-family: var(--mono);
  font-size: 72px;
  font-weight: 700;
  color: var(--primary-strong);
  line-height: 1;
  letter-spacing: -0.02em;
}

.nf-title {
  margin-top: 16px;
  font-size: 26px;
  font-weight: 700;
}

.nf-desc {
  margin-top: 10px;
  color: var(--text-muted);
  font-size: 15px;
  max-width: 460px;
}

.nf-actions {
  margin-top: 28px;
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
}

.nf-link {
  color: var(--ink);
  font-weight: 600;
  font-size: 14.5px;
  transition: color 0.15s ease;
}

.nf-link.muted {
  color: var(--text-muted);
  font-weight: 500;
}

.nf-link:hover {
  color: var(--primary-strong);
}
</style>
