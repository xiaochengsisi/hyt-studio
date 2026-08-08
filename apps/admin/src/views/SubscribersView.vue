<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { adminApi } from '../api/client';
import type { Subscriber } from '@hyt/shared';

const list = ref<Subscriber[]>([]);
const loading = ref(false);
const error = ref('');
const success = ref('');
const sending = ref(false);
const showBroadcast = ref(false);

const subject = ref('');
const html = ref('');

async function load() {
  loading.value = true;
  error.value = '';
  try {
    list.value = await adminApi.listSubscribers();
  } catch (e: any) {
    error.value = e.message || '加载失败';
  } finally {
    loading.value = false;
  }
}

onMounted(load);

const confirmedCount = () => list.value.filter((s) => s.confirmed).length;

async function onBroadcast() {
  if (!subject.value || !html.value) {
    error.value = '主题和正文不能为空';
    return;
  }
  if (!confirm(`将向 ${confirmedCount()} 名已确认订阅者群发邮件，确定？`)) return;
  sending.value = true;
  error.value = '';
  success.value = '';
  try {
    const r = await adminApi.broadcastSubscribers(subject.value, html.value);
    success.value = `已发送 ${r.sent} 封邮件`;
    subject.value = '';
    html.value = '';
    showBroadcast.value = false;
  } catch (e: any) {
    error.value = e.message || '发送失败';
  } finally {
    sending.value = false;
  }
}
</script>

<template>
  <div>
    <div class="page-head">
      <h1 class="page-title">Newsletter 订阅</h1>
      <button class="button button-primary" :disabled="!confirmedCount()" @click="showBroadcast = !showBroadcast">
        ✉ 群发邮件
      </button>
    </div>

    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-num">{{ list.length }}</div>
        <div class="stat-label">总订阅</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">{{ confirmedCount() }}</div>
        <div class="stat-label">已确认</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">{{ list.length - confirmedCount() }}</div>
        <div class="stat-label">待确认</div>
      </div>
    </div>

    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <div v-if="success" class="alert alert-success">{{ success }}</div>

    <div v-if="showBroadcast" class="card">
      <h3 class="card-title">群发邮件</h3>
      <small class="muted">仅向已确认订阅者发送。需要在站点设置中配置 SMTP。</small>
      <div class="field">
        <label class="label">主题</label>
        <input class="input" v-model="subject" placeholder="新版本上线通知" />
      </div>
      <div class="field">
        <label class="label">正文（HTML）</label>
        <textarea class="textarea" rows="8" v-model="html" placeholder="<h2>...</h2><p>...</p>"></textarea>
      </div>
      <div class="btn-row">
        <button class="button button-primary" :disabled="sending" @click="onBroadcast">
          {{ sending ? '发送中…' : '立即发送' }}
        </button>
        <button class="button button-ghost" @click="showBroadcast = false">取消</button>
      </div>
    </div>

    <div v-if="loading" class="muted">加载中…</div>
    <div v-else-if="!list.length" class="card empty">
      <p class="muted">暂无订阅者。前台访客订阅后会出现在此列表。</p>
    </div>
    <div v-else class="card">
      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>邮箱</th>
            <th>状态</th>
            <th>订阅时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in list" :key="s.id">
            <td>{{ s.id }}</td>
            <td>{{ s.email }}</td>
            <td>
              <span class="tag" :class="s.confirmed ? 'ok' : 'pending'">
                {{ s.confirmed ? '已确认' : '待确认' }}
              </span>
            </td>
            <td class="muted">{{ new Date(s.createdAt).toLocaleString() }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 14px;
  margin-bottom: 20px;
}

.stat-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 18px;
}

.stat-num {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.stat-label {
  color: var(--text-muted);
  font-size: 12px;
  margin-top: 4px;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 4px;
}

.tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}

.tag.ok {
  background: rgba(16, 185, 129, 0.12);
  color: #047857;
}

.tag.pending {
  background: rgba(245, 158, 11, 0.15);
  color: #b45309;
}

.btn-row {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

.empty {
  padding: 40px;
  text-align: center;
}

.muted {
  color: var(--text-muted);
  font-size: 12px;
}
</style>
