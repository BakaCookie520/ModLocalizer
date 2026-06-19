<template>
  <div class="translation-table">
    <header class="table-toolbar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索键名、原文或译文"
        clearable
        size="large"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <span>{{ filteredTableData.length }} / {{ tableData.length }} 条</span>
    </header>

    <el-alert
      v-if="dirty"
      title="有未保存的校对修改。请先点击“更新翻译文件”，再下载 Mod 或 Lang 包。"
      type="warning"
      :closable="false"
      show-icon
    />

    <el-table :data="filteredTableData" border stripe height="560" empty-text="暂无翻译结果">
      <el-table-column prop="key" label="键名" width="240" fixed="left">
        <template #default="{ row }">
          <code class="key-cell">{{ row.key }}</code>
        </template>
      </el-table-column>
      <el-table-column prop="original" label="英文原文" min-width="300">
        <template #default="{ row }">
          <div class="text-cell">{{ row.original }}</div>
        </template>
      </el-table-column>
      <el-table-column prop="translation" label="中文译文" min-width="340">
        <template #default="{ row }">
          <el-input
            v-model="row.translation"
            type="textarea"
            :autosize="{ minRows: 2, maxRows: 6 }"
            @input="handleTranslationInput(row)"
          />
        </template>
      </el-table-column>
    </el-table>

    <footer v-if="tableData.length > 0" class="table-actions">
      <el-button type="warning" size="large" :loading="updating" :disabled="!dirty" @click="handleUpdateTranslations">
        <el-icon v-if="!updating"><Check /></el-icon>
        更新翻译文件
      </el-button>
      <el-button type="primary" size="large" :loading="downloadingMod" :disabled="dirty || updating" @click="handleDownloadMod">
        <el-icon v-if="!downloadingMod"><Download /></el-icon>
        下载打包 Mod
      </el-button>
      <el-button type="success" size="large" :loading="downloadingLang" :disabled="dirty || updating" @click="handleDownloadLang">
        <el-icon v-if="!downloadingLang"><Download /></el-icon>
        下载 Lang 包
      </el-button>
    </footer>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Check, Download, Search } from '@element-plus/icons-vue';
import apiService from '../api';

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  sessionId: {
    type: String,
    required: true
  },
  modName: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['translation-updated']);

const tableData = ref([]);
const searchQuery = ref('');
const dirty = ref(false);
const updating = ref(false);
const downloadingMod = ref(false);
const downloadingLang = ref(false);

const filteredTableData = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return tableData.value;

  return tableData.value.filter((item) => {
    return [item.key, item.original, item.translation]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });
});

watch(
  () => props.data,
  (newData) => {
    tableData.value = newData.map((item, index) => ({ ...item, __index: index }));
    dirty.value = false;
  },
  { immediate: true, deep: true }
);

const handleTranslationInput = (row) => {
  dirty.value = true;
};

const handleUpdateTranslations = async () => {
  updating.value = true;
  try {
    const entries = tableData.value.map(({ __index, ...item }) => item);
    const result = await apiService.updateTranslations(props.sessionId, props.modName, entries);
    const updatedEntries = result.result || entries;
    tableData.value = updatedEntries.map((item, index) => ({ ...item, __index: index }));
    dirty.value = false;
    emit('translation-updated', updatedEntries);
    ElMessage.success(`已更新 ${result.updated || updatedEntries.length} 条翻译`);
  } catch (error) {
    ElMessage.error(`更新失败：${error.message}`);
  } finally {
    updating.value = false;
  }
};

const ensureSaved = () => {
  if (dirty.value) {
    ElMessage.warning('请先更新翻译文件，再下载');
    return false;
  }
  return true;
};

const downloadBlob = (blob, fileName) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

const handleDownloadMod = async () => {
  if (!ensureSaved()) return;
  downloadingMod.value = true;
  try {
    const blob = await apiService.downloadMod(props.sessionId);
    downloadBlob(blob, `mod_${Date.now()}.jar`);
    ElMessage.success('Mod 下载已开始');
  } catch (error) {
    ElMessage.error(`下载失败：${error.message}`);
  } finally {
    downloadingMod.value = false;
  }
};

const handleDownloadLang = async () => {
  if (!ensureSaved()) return;
  downloadingLang.value = true;
  try {
    const blob = await apiService.downloadLang(props.sessionId, props.modName);
    downloadBlob(blob, `${props.modName}_zh_cn_lang.zip`);
    ElMessage.success('Lang 包下载已开始');
  } catch (error) {
    ElMessage.error(`下载失败：${error.message}`);
  } finally {
    downloadingLang.value = false;
  }
};
</script>

<style scoped>
.translation-table {
  display: grid;
  gap: 14px;
}

.table-toolbar {
  display: grid;
  grid-template-columns: minmax(220px, 420px) auto;
  align-items: center;
  gap: 14px;
}

.table-toolbar span {
  justify-self: end;
  color: var(--muted);
  font-weight: 700;
}

.translation-table :deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
  transition: var(--ease-theme);
}

.translation-table :deep(th.el-table__cell) {
  background: var(--table-head);
  color: var(--text);
  font-weight: 800;
  transition: var(--ease-theme);
}

.key-cell {
  display: inline-block;
  max-width: 100%;
  padding: 4px 6px;
  border-radius: 6px;
  background: var(--code-bg);
  color: var(--code-text);
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  font-size: 12px;
  overflow-wrap: anywhere;
  white-space: normal;
  transition: var(--ease-theme);
}

.text-cell {
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.table-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 760px) {
  .table-toolbar {
    grid-template-columns: 1fr;
  }

  .table-toolbar span {
    justify-self: start;
  }

  .table-actions {
    flex-direction: column;
  }
}
</style>
