<script setup lang="ts">
import { reactive, ref } from 'vue';
import { auth, changePassword, logout } from '../stores/auth';
import { useRouter } from 'vue-router';

const router = useRouter();
const form = reactive({ oldPassword: '', newPassword: '', confirm: '' });
const error = ref('');
const loading = ref(false);

async function onSubmit() {
  error.value = '';
  if (!form.oldPassword) {
    error.value = '请输入原密码';
    return;
  }
  if (form.newPassword.length < 6) {
    error.value = '新密码至少 6 个字符';
    return;
  }
  if (form.newPassword !== form.confirm) {
    error.value = '两次输入的新密码不一致';
    return;
  }
  if (form.newPassword === form.oldPassword) {
    error.value = '新密码不能与原密码相同';
    return;
  }
  loading.value = true;
  try {
    await changePassword(form.oldPassword, form.newPassword);
    // auth.mustChangePassword 已在 store 中置 false，弹窗自动关闭
  } catch (e: any) {
    error.value = e.message || '修改失败';
  } finally {
    loading.value = false;
  }
}

function onLogout() {
  logout();
  router.push('/login');
}
</script>

<template>
  <div v-if="auth.mustChangePassword" class="mcp-mask">
    <div class="mcp-card">
      <div class="mcp-head">
        <div class="mcp-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
        </div>
        <div>
          <h2 class="mcp-title">首次登录请修改密码</h2>
          <p class="mcp-sub">为保障账号安全，使用默认密码登录后必须修改密码，否则无法使用后台。</p>
        </div>
      </div>

      <form @submit.prevent="onSubmit">
        <div v-if="error" class="alert alert-error">{{ error }}</div>
        <div class="field">
          <label class="label">原密码</label>
          <input
            class="input"
            v-model="form.oldPassword"
            type="password"
            autocomplete="current-password"
            placeholder="请输入当前密码"
            required
          />
        </div>
        <div class="field">
          <label class="label">新密码</label>
          <input
            class="input"
            v-model="form.newPassword"
            type="password"
            autocomplete="new-password"
            placeholder="至少 6 个字符"
            required
          />
        </div>
        <div class="field">
          <label class="label">确认新密码</label>
          <input
            class="input"
            v-model="form.confirm"
            type="password"
            autocomplete="new-password"
            placeholder="再次输入新密码"
            required
          />
        </div>
        <button class="button button-primary mcp-btn" type="submit" :disabled="loading">
          {{ loading ? '提交中…' : '修改密码并进入后台' }}
        </button>
        <button class="button button-ghost mcp-logout" type="button" @click="onLogout">退出登录</button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.mcp-mask {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.mcp-card {
  width: 400px;
  max-width: 100%;
  padding: 28px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
}

.mcp-head {
  display: flex;
  gap: 12px;
  margin-bottom: 22px;
}

.mcp-icon {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-sm);
  display: grid;
  place-items: center;
  background: var(--primary-soft);
  color: var(--primary-strong);
  flex-shrink: 0;
}

.mcp-title {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin: 2px 0 4px;
}

.mcp-sub {
  font-size: 12.5px;
  color: var(--text-muted);
  line-height: 1.5;
}

.mcp-btn {
  width: 100%;
  justify-content: center;
  padding: 10px;
  margin-top: 4px;
}

.mcp-logout {
  width: 100%;
  justify-content: center;
  margin-top: 8px;
}
</style>
