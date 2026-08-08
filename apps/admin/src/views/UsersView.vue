<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { adminApi } from '../api/client';
import { auth } from '../stores/auth';
import type { User } from '@hyt/shared';

const users = ref<User[]>([]);
const loading = ref(true);
const error = ref('');
const success = ref('');

const showCreate = ref(false);
const newUsername = ref('');
const newPassword = ref('');

const resetTarget = ref<User | null>(null);
const resetPassword = ref('');

async function load() {
  loading.value = true;
  try {
    users.value = await adminApi.listUsers();
  } finally {
    loading.value = false;
  }
}

onMounted(load);

async function onCreate() {
  error.value = '';
  success.value = '';
  try {
    await adminApi.createUser(newUsername.value, newPassword.value);
    newUsername.value = '';
    newPassword.value = '';
    showCreate.value = false;
    success.value = '已创建管理员';
    await load();
  } catch (e: any) {
    error.value = e.message || '创建失败';
  }
}

async function onReset() {
  if (!resetTarget.value) return;
  error.value = '';
  success.value = '';
  try {
    await adminApi.resetPassword(resetTarget.value.id, resetPassword.value);
    resetTarget.value = null;
    resetPassword.value = '';
    success.value = '密码已重置';
  } catch (e: any) {
    error.value = e.message || '重置失败';
  }
}

async function onDelete(u: User) {
  if (!confirm(`确定删除用户「${u.username}」？`)) return;
  try {
    await adminApi.deleteUser(u.id);
    await load();
  } catch (e: any) {
    error.value = e.message || '删除失败';
  }
}
</script>

<template>
  <div>
    <div class="page-head">
      <h1 class="page-title">用户管理</h1>
      <button class="button button-primary" @click="showCreate = !showCreate">
        {{ showCreate ? '取消' : '+ 新建' }}
      </button>
    </div>

    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <div v-if="success" class="alert alert-success">{{ success }}</div>

    <div v-if="showCreate" class="card create-card">
      <h3 class="card-title">创建管理员</h3>
      <div class="form-grid">
        <div class="field">
          <label class="label">用户名 *</label>
          <input class="input" v-model="newUsername" placeholder="至少 3 个字符" />
        </div>
        <div class="field">
          <label class="label">密码 *</label>
          <input class="input" type="password" v-model="newPassword" placeholder="至少 6 个字符" />
        </div>
      </div>
      <button class="button button-primary" @click="onCreate">创建</button>
    </div>

    <div class="card">
      <div v-if="loading" class="empty">loading…</div>
      <table v-else class="table">
        <thead>
          <tr>
            <th>username</th>
            <th>role</th>
            <th>created</th>
            <th>actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id">
            <td>
              {{ u.username }}
              <span v-if="auth.user?.id === u.id" class="badge badge-featured">you</span>
            </td>
            <td><span class="badge badge-published">{{ u.role }}</span></td>
            <td class="muted">{{ new Date(u.createdAt).toLocaleDateString() }}</td>
            <td>
              <div class="row-actions">
                <button class="button button-ghost" @click="resetTarget = u">重置密码</button>
                <button class="button button-danger" :disabled="auth.user?.id === u.id" @click="onDelete(u)">删除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="resetTarget" class="modal-mask" @click.self="resetTarget = null">
      <div class="modal">
        <h3 class="card-title">重置密码 · {{ resetTarget.username }}</h3>
        <div class="field">
          <label class="label">新密码 *</label>
          <input class="input" type="password" v-model="resetPassword" placeholder="至少 6 个字符" />
        </div>
        <div class="modal-actions">
          <button class="button button-primary" @click="onReset">确认重置</button>
          <button class="button button-ghost" @click="resetTarget = null">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.create-card {
  margin-bottom: 16px;
}

.card-title {
  margin: 0 0 14px;
  font-size: 16px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.muted {
  color: var(--text-muted);
}

.empty {
  padding: 40px;
  text-align: center;
  color: var(--text-muted);
}

.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 22px;
  width: 360px;
  max-width: 90vw;
  box-shadow: var(--shadow);
}

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}
</style>