<script setup lang="ts">
import { auth, logout } from '../stores/auth';
import { useRouter } from 'vue-router';

const router = useRouter();

function onLogout() {
  logout();
  router.push('/login');
}

const menu = [
  { to: '/', label: '仪表盘', icon: 'M3 12l9-8 9 8M5 10v10h5v-6h4v6h5V10' },
  { to: '/products', label: '产品', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { to: '/articles', label: '博客', icon: 'M4 5h16M4 9h16M4 13h10M4 17h6' },
  { to: '/submissions', label: '提交审核', icon: 'M12 3v12m0 0l-4-4m4 4l4-4M4 21h16' },
  { to: '/audit-log', label: '审计日志', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { to: '/content', label: '页面内容', icon: 'M4 6h16M4 10h16M4 14h10M4 18h7' },
  { to: '/users', label: '用户', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM4 21a8 8 0 0116 0' },
  { to: '/settings', label: '站点设置', icon: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z' },
];
</script>

<template>
  <div class="shell">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-logo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>
        </div>
        <div class="brand-text">
          <span class="brand-name">HYT Admin</span>
          <span class="brand-sub">控制台</span>
        </div>
      </div>

      <nav class="menu">
        <router-link
          v-for="m in menu"
          :key="m.to"
          :to="m.to"
          class="menu-item"
          :active-class="'active'"
          :exact-active-class="'active'"
          :end="m.to === '/'"
        >
          <svg class="menu-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path :d="m.icon" /></svg>
          <span>{{ m.label }}</span>
        </router-link>
      </nav>

      <div class="user">
        <div class="user-chip">
          <span class="user-avatar">{{ auth.user?.username?.charAt(0)?.toUpperCase() || 'A' }}</span>
          <span class="user-name">{{ auth.user?.username }}</span>
        </div>
        <button class="button button-ghost btn-logout" @click="onLogout">退出登录</button>
      </div>
    </aside>
    <main class="content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 232px;
  background: var(--card);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  padding: 20px 14px;
  position: sticky;
  top: 0;
  height: 100vh;
  flex-shrink: 0;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 8px 20px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 18px;
}

.brand-logo {
  width: 30px;
  height: 30px;
  border-radius: var(--radius-sm);
  display: grid;
  place-items: center;
  background: var(--ink);
  color: #fff;
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.brand-name {
  font-weight: 700;
  font-size: 14px;
  letter-spacing: -0.01em;
}

.brand-sub {
  color: var(--text-faint);
  font-family: var(--mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.menu {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 11px;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-weight: 500;
  font-size: 13.5px;
  transition: background 0.14s ease, color 0.14s ease;
}

.menu-item:hover {
  background: var(--bg-soft);
  color: var(--text);
}

.menu-item.active {
  background: var(--ink);
  color: #fff;
  font-weight: 600;
}

.user {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 14px;
  border-top: 1px solid var(--border);
}

.user-chip {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  display: grid;
  place-items: center;
  background: var(--bg-muted);
  color: var(--ink);
  font-weight: 700;
  font-size: 13px;
}

.user-name {
  font-weight: 600;
  font-size: 13.5px;
}

.btn-logout {
  width: 100%;
}

.content {
  flex: 1;
  padding: 28px 32px;
  min-width: 0;
}

@media (max-width: 720px) {
  .sidebar {
    width: 64px;
    padding: 16px 8px;
  }
  .brand-text,
  .menu-item span,
  .user-name {
    display: none;
  }
  .menu-item {
    justify-content: center;
    padding: 10px;
  }
  .user-chip {
    justify-content: center;
  }
  .content {
    padding: 20px 16px;
  }
}
</style>