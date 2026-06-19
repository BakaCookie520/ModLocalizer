<template>
  <div class="file-upload">
    <el-upload
      drag
      :auto-upload="false"
      :on-change="handleFileChange"
      :on-remove="handleFileRemove"
      :file-list="fileList"
      :limit="1"
      accept=".jar"
    >
      <div class="dropzone">
        <el-icon><UploadFilled /></el-icon>
        <div>
          <h3>拖入 .jar 文件</h3>
          <p>或点击选择 Minecraft Mod 文件，最大 100MB。</p>
        </div>
      </div>
    </el-upload>

    <div v-if="selectedFile" class="file-card">
      <span class="file-icon">
        <el-icon><Document /></el-icon>
      </span>
      <div class="file-meta">
        <strong>{{ selectedFile.name }}</strong>
        <small>{{ formatFileSize(selectedFile.size) }}</small>
      </div>
      <el-button type="primary" size="large" :loading="uploading" @click="handleUpload">
        <el-icon v-if="!uploading"><Upload /></el-icon>
        上传并分析
      </el-button>
    </div>

    <div v-if="uploading || uploadStatus" class="upload-progress">
      <el-progress :percentage="uploadProgress" :stroke-width="12" :status="uploadStatus" />
      <span>{{ progressText }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Document, Upload, UploadFilled } from '@element-plus/icons-vue';
import apiService from '../api';

const emit = defineEmits(['upload-success']);

const fileList = ref([]);
const uploading = ref(false);
const uploadProgress = ref(0);
const uploadStatus = ref('');

const selectedFile = computed(() => fileList.value[0]?.raw || fileList.value[0] || null);

const progressText = computed(() => {
  if (uploadStatus.value === 'success') return '上传完成，正在进入下一步。';
  if (uploadStatus.value === 'exception') return '上传失败，请检查文件或 API 配置。';
  return '正在上传并解析语言文件。';
});

const handleFileChange = (file) => {
  if (!file.name.toLowerCase().endsWith('.jar')) {
    ElMessage.warning('请选择 .jar 格式的 Mod 文件');
    fileList.value = [];
    return;
  }
  fileList.value = [file];
  uploadProgress.value = 0;
  uploadStatus.value = '';
};

const handleFileRemove = () => {
  fileList.value = [];
  uploadProgress.value = 0;
  uploadStatus.value = '';
};

const handleUpload = async () => {
  const file = selectedFile.value;
  if (!file) {
    ElMessage.warning('请先选择文件');
    return;
  }

  uploading.value = true;
  uploadProgress.value = 25;
  uploadStatus.value = '';

  try {
    const result = await apiService.uploadModFile(file);
    uploadProgress.value = 100;
    uploadStatus.value = 'success';
    ElMessage.success('文件解析完成');
    emit('upload-success', result);
  } catch (error) {
    uploadProgress.value = 100;
    uploadStatus.value = 'exception';
    ElMessage.error(`上传失败：${error.message}`);
  } finally {
    uploading.value = false;
  }
};

const formatFileSize = (bytes = 0) => {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, index);
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[index]}`;
};
</script>

<style scoped>
.file-upload {
  display: grid;
  gap: 18px;
}

.file-upload :deep(.el-upload) {
  width: 100%;
}

.file-upload :deep(.el-upload-dragger) {
  width: 100%;
  min-height: 260px;
  display: grid;
  place-items: center;
  border: 1px dashed var(--dropzone-border);
  border-radius: 8px;
  background: var(--dropzone-bg);
  transition: var(--ease-theme), transform 0.2s ease;
}

.file-upload :deep(.el-upload-dragger:hover) {
  border-color: var(--primary);
  background: var(--primary-weak);
}

.dropzone {
  display: grid;
  justify-items: center;
  gap: 12px;
  padding: 28px;
  text-align: center;
}

.dropzone .el-icon {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  background: var(--panel-strong);
  color: var(--primary);
  font-size: 34px;
  box-shadow: var(--icon-shadow);
  transition: var(--ease-theme);
}

.dropzone h3 {
  margin: 0;
  color: var(--text);
  font-size: 20px;
}

.dropzone p {
  margin: 6px 0 0;
  color: var(--muted);
  line-height: 1.6;
}

.file-card {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--panel-soft);
  transition: var(--ease-theme);
}

.file-icon {
  display: inline-grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: var(--panel-strong);
  color: var(--primary);
  font-size: 24px;
  transition: var(--ease-theme);
}

.file-meta strong,
.file-meta small {
  display: block;
  overflow-wrap: anywhere;
}

.file-meta small {
  margin-top: 4px;
  color: var(--muted);
}

.upload-progress {
  display: grid;
  gap: 8px;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--panel-strong);
  transition: var(--ease-theme);
}

.upload-progress span {
  color: var(--muted);
  font-size: 13px;
}

@media (max-width: 700px) {
  .file-card {
    grid-template-columns: 48px minmax(0, 1fr);
  }

  .file-card .el-button {
    grid-column: 1 / -1;
    width: 100%;
  }
}
</style>
