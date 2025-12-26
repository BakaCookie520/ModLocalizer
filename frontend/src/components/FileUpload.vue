<template>
  <div class="file-upload">
    <el-upload
      class="modern-upload"
      drag
      :auto-upload="false"
      :on-change="handleFileChange"
      :file-list="fileList"
      :limit="1"
      accept=".jar"
    >
      <div class="upload-content">
        <div class="upload-icon-wrapper">
          <el-icon class="upload-icon"><UploadFilled /></el-icon>
        </div>
        <div class="upload-text">
          <p class="main-text">将mod文件拖到此处</p>
          <p class="sub-text">或<em>点击上传</em></p>
        </div>
      </div>
      <template #tip>
        <div class="upload-tip">
          <el-icon><InfoFilled /></el-icon>
          <span>只能上传.jar文件，最大100MB</span>
        </div>
      </template>
    </el-upload>

    <transition name="fade">
      <div v-if="fileList.length > 0" class="file-info">
        <el-card class="file-card" shadow="hover">
          <div class="file-details">
            <el-icon class="file-icon"><Document /></el-icon>
            <div class="file-name">{{ fileList[0].name }}</div>
            <div class="file-size">{{ formatFileSize(fileList[0].size) }}</div>
          </div>
        </el-card>
        <el-button
          type="primary"
          @click="handleUpload"
          :loading="uploading"
          class="upload-button"
          size="large"
        >
          <el-icon v-if="!uploading"><Upload /></el-icon>
          <span>{{ uploading ? '上传中...' : '上传并处理' }}</span>
        </el-button>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="uploading" class="progress-wrapper">
        <el-progress
          :percentage="uploadProgress"
          :status="uploadStatus"
          :stroke-width="20"
          text-inside
          class="modern-progress"
        />
        <div class="progress-status">
          <el-icon v-if="uploadStatus === 'success'"><CircleCheck /></el-icon>
          <el-icon v-else-if="uploadStatus === 'exception'"><CircleClose /></el-icon>
          <el-icon v-else><Loading /></el-icon>
          <span>{{ getProgressText() }}</span>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { 
  UploadFilled, 
  InfoFilled, 
  Document, 
  Upload, 
  CircleCheck, 
  CircleClose, 
  Loading 
} from '@element-plus/icons-vue';
import apiService from '../api';

const emit = defineEmits(['upload-success']);

const fileList = ref([]);
const uploading = ref(false);
const uploadProgress = ref(0);
const uploadStatus = ref('');

const handleFileChange = (file) => {
  fileList.value = [file];
};

const handleUpload = async () => {
  if (fileList.value.length === 0) {
    ElMessage.warning('请先选择文件');
    return;
  }

  const file = fileList.value[0].raw;
  if (!file) {
    ElMessage.warning('文件无效');
    return;
  }

  uploading.value = true;
  uploadProgress.value = 0;
  uploadStatus.value = '';

  try {
    uploadProgress.value = 30;
    uploadStatus.value = 'active';
    
    const result = await apiService.uploadModFile(file);
    
    uploadProgress.value = 100;
    uploadStatus.value = 'success';
    
    ElMessage.success('文件上传成功');
    emit('upload-success', result);
  } catch (error) {
    uploadProgress.value = 0;
    uploadStatus.value = 'exception';
    ElMessage.error('上传失败: ' + error.message);
  } finally {
    uploading.value = false;
  }
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

const getProgressText = () => {
  if (uploadStatus.value === 'success') return '上传成功！';
  if (uploadStatus.value === 'exception') return '上传失败';
  return '正在上传...';
};
</script>

<style scoped>
.file-upload {
  width: 100%;
}

.modern-upload {
  width: 100%;
}

.modern-upload :deep(.el-upload-dragger) {
  width: 100%;
  height: 280px;
  border: 2px dashed #d9d9d9;
  border-radius: 16px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.modern-upload :deep(.el-upload-dragger:hover) {
  border-color: #409eff;
  background: linear-gradient(135deg, #e8f4ff 0%, #d1e7ff 100%);
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(64, 158, 255, 0.2);
}

.upload-content {
  text-align: center;
}

.upload-icon-wrapper {
  margin-bottom: 20px;
}

.upload-icon {
  font-size: 64px;
  color: #409eff;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

.upload-text {
  color: #606266;
}

.main-text {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #303133;
}

.sub-text {
  font-size: 14px;
  color: #909399;
}

.sub-text em {
  color: #409eff;
  font-style: normal;
  font-weight: 600;
}

.upload-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 15px;
  color: #909399;
  font-size: 13px;
}

.upload-tip .el-icon {
  color: #409eff;
}

.file-info {
  margin-top: 25px;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.file-card {
  margin-bottom: 15px;
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.file-details {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 10px;
}

.file-icon {
  font-size: 32px;
  color: #409eff;
}

.file-name {
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.file-size {
  font-size: 14px;
  color: #909399;
}

.upload-button {
  width: 100%;
  padding: 15px;
  font-size: 16px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
  transition: all 0.3s ease;
}

.upload-button:hover {
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.4);
  transform: translateY(-2px);
}

.progress-wrapper {
  margin-top: 25px;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 12px;
  animation: slideUp 0.3s ease-out;
}

.modern-progress {
  margin-bottom: 15px;
}

.progress-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #606266;
  font-size: 14px;
}

.progress-status .el-icon {
  font-size: 18px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>

