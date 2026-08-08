<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { login } from '../stores/auth';

const router = useRouter();
const form = reactive({ username: '', password: '' });
const error = ref('');
const loading = ref(false);

async function onSubmit() {
  error.value = '';
  loading.value = true;
  try {
    await login(form);
    router.push('/');
  } catch (e: any) {
    error.value = e.message || '登录失败';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="login-wrap">
    <div class="card login-card">
      <div class="brand">
        <div class="brand-logo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>
        </div>
        <div>
          <h1 class="title">HYT Admin</h1>
          <p class="sub">管理后台 · 请登录</p>
        </div>
      </div>

      <form @submit.prevent="onSubmit">
        <div v-if="error" class="alert alert-error">{{ error }}</div>
        <div class="field">
          <label class="label">用户名</label>
          <input class="input" v-model="form.username" autocomplete="username" placeholder="请输入用户名" required />
        </div>
        <div class="field">
          <label class="label">密码</label>
          <input
            class="input"
            v-model="form.password"
            type="password"
            autocomplete="current-password"
            placeholder="请输入密码"
            required
          />
        </div>
        <button class="button button-primary login-btn" type="submit" :disabled="loading">
          {{ loading ? '登录中…' : '登录' }}
        </button>
      </form>

      <p class="foot muted">仅管理员可访问 · HYT Studio</p>
    </div>
  </div>
</template>

<style scoped>
.login-wrap {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(760px 420px at 50% -10%, rgba(16, 185, 129, 0.14), transparent 60%),
    var(--bg);
  padding: 24px;
}

.login-card {
  width: 380px;
  padding: 32px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.brand-logo {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  display: grid;
  place-items: center;
  background: var(--ink);
  color: #fff;
}

.title {
  font-size: 19px;
  font-weight: 700;
  letter-spacing: -0.015em;
  line-height: 1.2;
}

.sub {
  color: var(--text-muted);
  font-size: 13px;
  margin-top: 2px;
}

.muted {
  color: var(--text-muted);
}

.login-btn {
  width: 100%;
  justify-content: center;
  padding: 11px;
}

.foot {
  text-align: center;
  font-size: 12px;
  margin: 20px 0 0;
}
</style>