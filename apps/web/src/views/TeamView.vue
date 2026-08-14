<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api } from '../api/client';
import type { Member } from '@hyt/shared';
import Skeleton from '../components/Skeleton.vue';
import { setSeo } from '../composables/useSeo';
import { safeUrl } from '../utils/safe-url';

const members = ref<Member[]>([]);
const loading = ref(true);
const error = ref('');

onMounted(async () => {
  setSeo('团队', 'HYT Studio 的团队成员与贡献者');
  error.value = '';
  try {
    members.value = await api.getMembers();
  } catch (e: any) {
    error.value = e.message || '加载失败，请稍后重试';
  } finally {
    loading.value = false;
  }
});

function initials(name: string): string {
  return (name.charAt(0) || '?').toUpperCase();
}
</script>

<template>
  <section class="section">
    <div class="container">
      <div class="section-head" v-reveal>
        <div class="section-head-main">
          <span class="section-eyebrow">Team</span>
          <h1 class="section-title">团队成员</h1>
          <p class="section-sub">维护这些开源项目的人。</p>
        </div>
      </div>

      <Skeleton v-if="loading" :lines="3" />
      <div v-else-if="error" class="empty error-text">{{ error }}</div>
      <div v-else-if="members.length" class="team-grid">
        <article
          v-for="(m, i) in members"
          :key="m.id"
          class="card member-card"
          v-reveal="`d-${(i % 4) + 1}`"
        >
          <div class="member-head">
            <div class="avatar" v-if="m.avatarUrl">
              <img :src="m.avatarUrl" :alt="m.name" loading="lazy" />
            </div>
            <div class="avatar avatar-fallback" v-else>{{ initials(m.name) }}</div>
            <div class="member-meta">
              <h3 class="member-name">{{ m.name }}</h3>
              <span class="member-role">{{ m.role }}</span>
            </div>
          </div>
          <p v-if="m.bio" class="member-bio">{{ m.bio }}</p>
          <div class="member-links" v-if="m.github || m.twitter || m.website || m.email">
            <a v-if="m.github" :href="safeUrl(m.github)" target="_blank" rel="noopener" class="mlink">GitHub ↗</a>
            <a v-if="m.twitter" :href="safeUrl(m.twitter)" target="_blank" rel="noopener" class="mlink">Twitter ↗</a>
            <a v-if="m.website" :href="safeUrl(m.website)" target="_blank" rel="noopener" class="mlink">网站 ↗</a>
            <a v-if="m.email" :href="`mailto:${m.email}`" class="mlink">邮箱 ↗</a>
          </div>
        </article>
      </div>
      <div v-else class="empty">还没有团队成员。</div>
    </div>
  </section>
</template>

<style scoped>
.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2px;
  background: var(--line);
  border: 1px solid var(--line);
  border-radius: var(--radius);
}

.member-card {
  background: var(--bg);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.member-head {
  display: flex;
  align-items: center;
  gap: 14px;
}

.avatar {
  width: 52px;
  height: 52px;
  border-radius: var(--radius);
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid var(--line-strong);
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-fallback {
  display: grid;
  place-items: center;
  background: var(--bg-muted);
  color: var(--ink);
  font-weight: 700;
  font-size: 22px;
}

.member-meta {
  min-width: 0;
}

.member-name {
  font-size: 17px;
  font-weight: 700;
  margin: 0 0 2px;
}

.member-role {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--accent);
  letter-spacing: 0.04em;
}

.member-bio {
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.7;
  margin: 0;
  white-space: pre-line;
}

.member-links {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: auto;
  padding-top: 6px;
}

.mlink {
  font-size: 13px;
  color: var(--text-muted);
  font-weight: 600;
  transition: color 0.15s ease;
}

.mlink:hover {
  color: var(--accent);
}

@media (max-width: 680px) {
  .team-grid {
    grid-template-columns: 1fr;
  }
}
</style>
