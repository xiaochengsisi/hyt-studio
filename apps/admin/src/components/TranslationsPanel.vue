<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { adminApi } from '../api/client';

const props = defineProps<{
  type: 'product' | 'article';
  entityId: number | null;
  /** 可翻译字段定义 */
  fields: { key: string; label: string; multiline?: boolean }[];
}>();

interface Translation {
  locale: string;
  fields: Record<string, string>;
}

const list = ref<Translation[]>([]);
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const success = ref('');

const newLocale = ref('');
const editing = ref<Translation | null>(null);

const COMMON_LOCALES = ['en-US', 'zh-CN', 'zh-TW', 'ja-JP', 'ko-KR', 'fr-FR', 'de-DE', 'es-ES', 'ru-RU'];

const availableLocales = computed(() => {
  const used = new Set(list.value.map((t) => t.locale));
  return COMMON_LOCALES.filter((l) => !used.has(l));
});

async function load() {
  if (!props.entityId) {
    list.value = [];
    return;
  }
  loading.value = true;
  error.value = '';
  try {
    list.value = await adminApi.listTranslations(props.type, props.entityId);
  } catch (e: any) {
    error.value = e.message || '加载失败';
  } finally {
    loading.value = false;
  }
}

watch(() => props.entityId, load, { immediate: true });

function startAdd() {
  editing.value = {
    locale: newLocale.value || availableLocales.value[0] || 'en-US',
    fields: {},
  };
  newLocale.value = '';
}

function startEdit(t: Translation) {
  editing.value = { locale: t.locale, fields: { ...t.fields } };
}

function cancelEdit() {
  editing.value = null;
}

async function onSave() {
  if (!editing.value || !props.entityId) return;
  if (!editing.value.locale) {
    error.value = '请填写语言代码';
    return;
  }
  saving.value = true;
  error.value = '';
  success.value = '';
  try {
    await adminApi.saveTranslation(
      props.type,
      props.entityId,
      editing.value.locale,
      editing.value.fields,
    );
    success.value = `已保存 ${editing.value.locale} 翻译`;
    editing.value = null;
    await load();
  } catch (e: any) {
    error.value = e.message || '保存失败';
  } finally {
    saving.value = false;
  }
}

async function onDelete(locale: string) {
  if (!props.entityId) return;
  if (!confirm(`确定删除 ${locale} 翻译？`)) return;
  try {
    await adminApi.deleteTranslation(props.type, props.entityId, locale);
    await load();
  } catch (e: any) {
    error.value = e.message || '删除失败';
  }
}
</script>

<template>
  <div class="trans-panel">
    <h3 class="trans-title">多语言翻译</h3>
    <small class="muted">为不同语言访客提供本地化内容。前台按 Accept-Language 或 ?lang= 参数返回对应翻译。</small>

    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <div v-if="success" class="alert alert-success">{{ success }}</div>

    <div v-if="loading" class="muted" style="margin-top: 12px">加载中…</div>

    <div v-else style="margin-top: 14px">
      <!-- 已有翻译列表 -->
      <div v-if="!editing">
        <div v-if="!list.length" class="muted empty-row">暂无翻译，新增第一个语言版本</div>
        <div v-else class="trans-list">
          <div v-for="t in list" :key="t.locale" class="trans-item">
            <div class="trans-locale">{{ t.locale }}</div>
            <div class="trans-summary muted">
              {{ props.fields.filter((f) => t.fields[f.key]).length }} / {{ props.fields.length }} 字段已翻译
            </div>
            <div class="trans-actions">
              <button class="link-btn" @click="startEdit(t)">编辑</button>
              <button class="link-btn danger" @click="onDelete(t.locale)">删除</button>
            </div>
          </div>
        </div>

        <!-- 新增语言 -->
        <div class="add-row">
          <select class="select" v-model="newLocale" v-if="availableLocales.length">
            <option value="">选择语言…</option>
            <option v-for="l in availableLocales" :key="l" :value="l">{{ l }}</option>
          </select>
          <input v-else class="input" v-model="newLocale" placeholder="自定义语言代码（如 pt-BR）" />
          <button class="button button-ghost" @click="startAdd">+ 新增翻译</button>
        </div>
      </div>

      <!-- 编辑表单 -->
      <div v-else class="edit-box">
        <div class="edit-head">
          <h4>编辑翻译：{{ editing.locale }}</h4>
          <button class="link-btn" @click="cancelEdit">取消</button>
        </div>
        <div v-for="f in props.fields" :key="f.key" class="field">
          <label class="label">{{ f.label }}</label>
          <textarea
            v-if="f.multiline"
            class="textarea"
            rows="4"
            v-model="editing.fields[f.key]"
            :placeholder="`留空则使用原语言内容`"
          ></textarea>
          <input v-else class="input" v-model="editing.fields[f.key]" placeholder="留空则使用原语言内容" />
        </div>
        <div class="btn-row">
          <button class="button button-primary" :disabled="saving" @click="onSave">
            {{ saving ? '保存中…' : '保存' }}
          </button>
          <button class="button button-ghost" @click="cancelEdit">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.trans-panel {
  margin-top: 24px;
  padding: 20px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.trans-title {
  font-size: 15px;
  font-weight: 700;
  margin: 0 0 4px;
}

.muted {
  color: var(--text-muted);
  font-size: 12px;
}

.empty-row {
  padding: 12px 0;
}

.trans-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
}

.trans-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}

.trans-locale {
  font-family: var(--mono);
  font-size: 13px;
  font-weight: 700;
  min-width: 80px;
}

.trans-summary {
  flex: 1;
}

.trans-actions {
  display: flex;
  gap: 12px;
}

.link-btn {
  background: none;
  border: 0;
  color: var(--ink);
  font-size: 12px;
  cursor: pointer;
  padding: 0;
}

.link-btn.danger {
  color: #ef4444;
}

.add-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.add-row .select,
.add-row .input {
  max-width: 200px;
}

.edit-box {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 16px;
  background: var(--bg-soft);
}

.edit-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.edit-head h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
}

.btn-row {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

.alert {
  margin-top: 12px;
}
</style>
