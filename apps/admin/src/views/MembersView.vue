<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { adminApi } from '../api/client';
import type { Member } from '@hyt/shared';
import ImageUploader from '../components/ImageUploader.vue';

const members = ref<Member[]>([]);
const loading = ref(true);
const error = ref('');

/** 当前编辑的成员：null=未编辑，0=新建，>0=编辑现有 */
const editingId = ref<number | null>(null);
const saving = ref(false);

const form = reactive<Partial<Member>>({
  name: '',
  role: '',
  bio: '',
  avatarUrl: '',
  github: '',
  twitter: '',
  email: '',
  website: '',
  sortOrder: 0,
});

async function load() {
  loading.value = true;
  try {
    members.value = await adminApi.listMembers();
  } finally {
    loading.value = false;
  }
}

onMounted(load);

function resetForm() {
  form.name = '';
  form.role = '';
  form.bio = '';
  form.avatarUrl = '';
  form.github = '';
  form.twitter = '';
  form.email = '';
  form.website = '';
  form.sortOrder = 0;
}

function startCreate() {
  resetForm();
  editingId.value = 0;
  error.value = '';
}

function startEdit(m: Member) {
  resetForm();
  Object.assign(form, m);
  editingId.value = m.id;
  error.value = '';
}

function cancelEdit() {
  editingId.value = null;
  error.value = '';
}

async function onSubmit() {
  error.value = '';
  if (!form.name) {
    error.value = '请填写姓名';
    return;
  }
  saving.value = true;
  try {
    if (editingId.value === 0) {
      await adminApi.createMember(form);
    } else if (editingId.value) {
      await adminApi.updateMember(editingId.value, form);
    }
    editingId.value = null;
    await load();
  } catch (e: any) {
    error.value = e.message || '保存失败';
  } finally {
    saving.value = false;
  }
}

async function onDelete(m: Member) {
  if (!confirm(`确定删除成员「${m.name}」？`)) return;
  try {
    await adminApi.deleteMember(m.id);
    await load();
  } catch (e: any) {
    alert(e.message || '删除失败');
  }
}

function initials(name: string): string {
  return (name.charAt(0) || '?').toUpperCase();
}
</script>

<template>
  <div>
    <div class="page-head">
      <h1 class="page-title">团队成员</h1>
      <button class="button button-primary" @click="startCreate">+ 新增成员</button>
    </div>

    <div v-if="editingId !== null" class="card edit-panel">
      <h2 class="panel-title">{{ editingId === 0 ? '新增成员' : '编辑成员' }}</h2>
      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <form @submit.prevent="onSubmit">
        <div class="form-grid">
          <div class="field">
            <label class="label">姓名 *</label>
            <input class="input" v-model="form.name" required />
          </div>
          <div class="field">
            <label class="label">角色 / 头衔</label>
            <input class="input" v-model="form.role" placeholder="如：创始人 / 维护者 / 贡献者" />
          </div>
        </div>

        <div class="field">
          <label class="label">头像</label>
          <ImageUploader v-model="form.avatarUrl" />
        </div>

        <div class="field">
          <label class="label">简介</label>
          <textarea class="textarea" v-model="form.bio" placeholder="一两句话介绍"></textarea>
        </div>

        <div class="form-grid">
          <div class="field">
            <label class="label">GitHub</label>
            <input class="input" v-model="form.github" placeholder="https://github.com/..." />
          </div>
          <div class="field">
            <label class="label">Twitter / X</label>
            <input class="input" v-model="form.twitter" />
          </div>
          <div class="field">
            <label class="label">邮箱</label>
            <input class="input" v-model="form.email" />
          </div>
          <div class="field">
            <label class="label">个人站点</label>
            <input class="input" v-model="form.website" />
          </div>
          <div class="field">
            <label class="label">排序值（越小越靠前）</label>
            <input class="input" type="number" v-model.number="form.sortOrder" style="max-width: 160px" />
          </div>
        </div>

        <div class="panel-actions">
          <button class="button button-primary" type="submit" :disabled="saving">
            {{ saving ? '保存中…' : '保存' }}
          </button>
          <button class="button button-ghost" type="button" @click="cancelEdit">取消</button>
        </div>
      </form>
    </div>

    <div v-else class="card">
      <div v-if="loading" class="muted">加载中…</div>
      <table v-else-if="members.length" class="table">
        <thead>
          <tr>
            <th style="width: 56px"></th>
            <th>姓名</th>
            <th>角色</th>
            <th>简介</th>
            <th>排序</th>
            <th style="width: 140px">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in members" :key="m.id">
            <td>
              <div class="row-avatar" v-if="m.avatarUrl">
                <img :src="m.avatarUrl" :alt="m.name" />
              </div>
              <div class="row-avatar row-avatar-fallback" v-else>{{ initials(m.name) }}</div>
            </td>
            <td>
              <div class="row-name">{{ m.name }}</div>
              <div v-if="m.github" class="row-sub">{{ m.github }}</div>
            </td>
            <td>{{ m.role }}</td>
            <td class="row-bio">{{ m.bio }}</td>
            <td class="mono">{{ m.sortOrder }}</td>
            <td>
              <button class="link-btn" @click="startEdit(m)">编辑</button>
              <button class="link-btn link-danger" @click="onDelete(m)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty">还没有团队成员，点击右上角「新增成员」。</div>
    </div>
  </div>
</template>

<style scoped>
.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.edit-panel {
  margin-bottom: 20px;
}

.panel-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 18px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.panel-actions {
  display: flex;
  gap: 10px;
  margin-top: 18px;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.table th,
.table td {
  text-align: left;
  padding: 12px 10px;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}

.table th {
  font-weight: 600;
  color: var(--text-faint);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.row-avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  border: 1px solid var(--border);
}

.row-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.row-avatar-fallback {
  display: grid;
  place-items: center;
  background: var(--bg-muted);
  color: var(--ink);
  font-weight: 700;
  font-size: 14px;
}

.row-name {
  font-weight: 600;
}

.row-sub {
  font-size: 12px;
  color: var(--text-faint);
}

.row-bio {
  color: var(--text-muted);
  font-size: 13px;
  max-width: 320px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.link-btn {
  background: none;
  border: none;
  color: var(--primary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 6px;
}

.link-danger {
  color: #ef4444;
}

.empty {
  text-align: center;
  color: var(--text-muted);
  padding: 40px 0;
}
</style>
