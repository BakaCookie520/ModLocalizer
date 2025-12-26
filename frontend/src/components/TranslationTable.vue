<template>
  <div class="translation-table">
    <div class="search-container">
      <el-input
        v-model="searchQuery"
        placeholder="搜索键名、英文原文或中文翻译..."
        clearable
        size="large"
        class="search-input"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>
    <el-table
      :data="filteredTableData"
      stripe
      border
      style="width: 100%"
      max-height="600"
    >
      <el-table-column prop="key" label="键名" width="200" fixed="left" />
      <el-table-column prop="original" label="英文原文" min-width="300">
        <template #default="{ row }">
          <div class="text-cell">{{ row.original }}</div>
        </template>
      </el-table-column>
      <el-table-column prop="translation" label="中文翻译" min-width="300">
        <template #default="{ row, $index }">
          <el-input
            v-model="row.translation"
            type="textarea"
            :rows="2"
            @change="handleTranslationChange($index, row.translation)"
          />
        </template>
      </el-table-column>
    </el-table>

    <div class="table-actions" v-if="tableData.length > 0">
      <el-button 
        type="primary" 
        @click="handleDownloadMod" 
        :loading="downloadingMod"
        size="large"
        class="download-button"
      >
        <el-icon v-if="!downloadingMod"><Download /></el-icon>
        <span>下载打包Mod</span>
      </el-button>
      <el-button 
        type="success" 
        @click="handleDownloadLang" 
        :loading="downloadingLang"
        size="large"
        class="download-button"
      >
        <el-icon v-if="!downloadingLang"><Download /></el-icon>
        <span>下载Lang文件</span>
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Download, Search } from '@element-plus/icons-vue';
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

const emit = defineEmits(['translation-change']);

const tableData = ref([]);
const filteredTableData = ref([]);
const searchQuery = ref('');
const downloadingMod = ref(false);
const downloadingLang = ref(false);

// 过滤数据
const filterData = (query, data) => {
  if (!query) {
    return data;
  }
  const lowerCaseQuery = query.toLowerCase();
  return data.filter(item => 
    item.key.toLowerCase().includes(lowerCaseQuery) ||
    item.original.toLowerCase().includes(lowerCaseQuery) ||
    (item.translation && item.translation.toLowerCase().includes(lowerCaseQuery))
  );
};

// 监听搜索查询变化
watch(searchQuery, (newQuery) => {
  filteredTableData.value = filterData(newQuery, tableData.value);
});

// 监听props变化
watch(() => props.data, (newData) => {
  tableData.value = newData.map(item => ({ ...item }));
  filteredTableData.value = filterData(searchQuery.value, tableData.value);
}, { immediate: true, deep: true });

const handleTranslationChange = (index, translation) => {
  emit('translation-change', index, translation);
};

const handleDownloadMod = async () => {
  downloadingMod.value = true;
  try {
    const blob = await apiService.downloadMod(props.sessionId);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mod_${Date.now()}.jar`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    ElMessage.success('下载成功');
  } catch (error) {
    ElMessage.error('下载失败: ' + error.message);
  } finally {
    downloadingMod.value = false;
  }
};

const handleDownloadLang = async () => {
  downloadingLang.value = true;
  try {
    const blob = await apiService.downloadLang(props.sessionId, props.modName);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${props.modName}_zh_cn_lang.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    ElMessage.success('下载成功');
  } catch (error) {
    ElMessage.error('下载失败: ' + error.message);
  } finally {
    downloadingLang.value = false;
  }
};
</script>

<style scoped>
.translation-table {
  width: 100%;
}

.search-container {
  margin-bottom: 20px;
}

.search-input {
  max-width: 400px;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.search-input :deep(.el-input__wrapper:hover) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.search-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.translation-table :deep(.el-table) {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.translation-table :deep(.el-table__header) {
  background: #f8f9fa;
}

.translation-table :deep(.el-table__header th) {
  background: #f8f9fa;
  color: #000000;
  font-weight: 600;
  border-bottom: 2px solid #ebeef5;
}

.translation-table :deep(.el-table__body tr:hover) {
  background: linear-gradient(135deg, #f5f7fa 0%, #e8f4ff 100%);
}

.text-cell {
  word-break: break-word;
  white-space: pre-wrap;
  line-height: 1.6;
  padding: 8px 0;
}

.translation-table :deep(.el-textarea__inner) {
  border-radius: 8px;
  transition: all 0.3s ease;
}

.translation-table :deep(.el-textarea__inner:focus) {
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.table-actions {
  margin-top: 30px;
  text-align: center;
  display: flex;
  gap: 15px;
  justify-content: center;
}

.download-button {
  padding: 12px 30px;
  font-size: 16px;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.download-button:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  transform: translateY(-2px);
}

.download-button.el-button--primary {
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.download-button.el-button--primary:hover {
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.4);
}

.download-button.el-button--success {
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.3);
}

.download-button.el-button--success:hover {
  box-shadow: 0 6px 16px rgba(103, 194, 58, 0.4);
}
</style>

