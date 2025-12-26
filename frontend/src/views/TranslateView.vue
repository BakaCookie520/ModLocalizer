<template>
  <div class="translate-view">
    <!-- 步骤条 -->
    <el-card class="steps-card" shadow="hover">
      <el-steps :active="currentStep" finish-status="success" class="modern-steps">
        <el-step title="上传Mod">
          <template #icon>
            <el-icon><UploadFilled /></el-icon>
          </template>
        </el-step>
        <el-step title="选择模组">
          <template #icon>
            <el-icon><FolderOpened /></el-icon>
          </template>
        </el-step>
        <el-step title="翻译">
          <template #icon>
            <el-icon><MagicStick /></el-icon>
          </template>
        </el-step>
        <el-step title="完成">
          <template #icon>
            <el-icon><CircleCheck /></el-icon>
          </template>
        </el-step>
      </el-steps>
    </el-card>

    <!-- 步骤1: 上传文件 -->
    <el-card v-if="currentStep === 0" class="step-card modern-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon class="header-icon"><UploadFilled /></el-icon>
          <span>上传Mod文件</span>
        </div>
      </template>
      <FileUpload @upload-success="handleUploadSuccess" />
    </el-card>

    <!-- 步骤2: 选择模组 -->
    <el-card v-if="currentStep === 1" class="step-card modern-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon class="header-icon"><FolderOpened /></el-icon>
          <span>选择要翻译的模组</span>
        </div>
      </template>
      <el-radio-group v-model="selectedModName" @change="handleModSelect" class="mod-radio-group">
        <div 
          v-for="langFile in langFiles" 
          :key="langFile.modName"
          class="custom-radio-item"
          :class="{ 'selected': selectedModName === langFile.modName }"
          @click="selectedModName = langFile.modName"
        >
          <div class="radio-input-wrapper">
            <div class="custom-radio" :class="{ 'checked': selectedModName === langFile.modName }"></div>
          </div>
          <div class="mod-info">
            <el-icon class="mod-icon"><Document /></el-icon>
            <div>
              <div class="mod-name">{{ langFile.modName }}</div>
              <div class="mod-count">{{ langFile.entryCount }} 条条目</div>
            </div>
          </div>
        </div>
      </el-radio-group>
<div class="action-buttons">
  <el-button 
    type="primary" 
    @click="handleLoadLangContent" 
    :disabled="!selectedModName"
    size="large"
    class="action-button"
  >
    <el-icon><ArrowRight /></el-icon>
    <span>加载内容</span>
  </el-button>
  <el-button @click="handleBack" size="large" class="action-button">
    <el-icon><ArrowLeft /></el-icon>
    <span>返回</span>
  </el-button>
</div>
    </el-card>

    <!-- 步骤3: 翻译 -->
    <el-card v-if="currentStep === 2" class="step-card modern-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon class="header-icon"><MagicStick /></el-icon>
          <span>翻译内容</span>
          <el-button 
            type="primary" 
            @click="handleTranslate" 
            :loading="translating" 
            class="translate-button"
            size="large"
          >
            <el-icon v-if="!translating"><MagicStick /></el-icon>
            <span>{{ translating ? '翻译中...' : '开始翻译' }}</span>
          </el-button>
        </div>
      </template>

      <el-alert
        v-if="langEntries.length > 0"
        :title="`共 ${langEntries.length} 条需要翻译`"
        type="info"
        :closable="false"
        class="info-alert"
        show-icon
      />

      <div v-if="translating" class="progress-container">
        <el-progress
          :percentage="translateProgress"
          :status="translateProgress === 100 ? 'success' : 'active'"
          :stroke-width="20"
          text-inside
          class="modern-progress"
        />
        <div class="progress-text">正在使用AI翻译中... {{ translateProgress }}%</div>
      </div>

      <TranslationTable
        v-if="translationResult.length > 0"
        :data="translationResult"
        :session-id="sessionId"
        :mod-name="selectedModName"
        @translation-change="handleTranslationChange"
      />

      <div v-else-if="langEntries.length > 0 && !translating" class="translate-prompt">
        <el-icon class="prompt-icon"><MagicStick /></el-icon>
        <p>准备就绪，点击开始翻译</p>
        <el-button type="primary" size="large" @click="handleTranslate" class="start-button">
          <el-icon><MagicStick /></el-icon>
          <span>开始翻译</span>
        </el-button>
      </div>

      <div class="action-buttons">
        <el-button @click="handleBack" size="large">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回</span>
        </el-button>
      </div>
    </el-card>

    <!-- 步骤4: 完成 -->
    <el-card v-if="currentStep === 3" class="step-card modern-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon class="header-icon"><CircleCheck /></el-icon>
          <span>翻译完成</span>
        </div>
      </template>

      <div class="success-content">
        <el-result icon="success" title="翻译完成" sub-title="您可以下载翻译后的文件" class="success-result">
          <template #icon>
            <div class="success-icon-wrapper">
              <el-icon class="success-icon"><CircleCheck /></el-icon>
            </div>
          </template>
        </el-result>
        <TranslationTable
          :data="translationResult"
          :session-id="sessionId"
          :mod-name="selectedModName"
          @translation-change="handleTranslationChange"
          class="result-table"
        />
      </div>

      <div class="action-buttons">
        <el-button @click="handleReset" size="large" type="primary">
          <el-icon><RefreshLeft /></el-icon>
          <span>重新开始</span>
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { 
  UploadFilled, 
  FolderOpened, 
  MagicStick, 
  CircleCheck, 
  Document,
  ArrowRight,
  ArrowLeft,
  RefreshLeft
} from '@element-plus/icons-vue';
import FileUpload from '../components/FileUpload.vue';
import TranslationTable from '../components/TranslationTable.vue';
import apiService from '../api';

const currentStep = ref(0);
const sessionId = ref('');
const langFiles = ref([]);
const selectedModName = ref('');
const langEntries = ref([]);
const translationResult = ref([]);
const translating = ref(false);
const translateProgress = ref(0);

// 上传成功处理
const handleUploadSuccess = (result) => {
  sessionId.value = result.sessionId;
  langFiles.value = result.langFiles;
  currentStep.value = 1;
};

// 选择模组
const handleModSelect = () => {
  // 可以在这里预加载内容
};

// 加载lang内容
const handleLoadLangContent = async () => {
  try {
    const result = await apiService.getLangContent(sessionId.value, selectedModName.value);
    langEntries.value = result.entries;
    currentStep.value = 2;
  } catch (error) {
    ElMessage.error('加载内容失败: ' + error.message);
  }
};

// 执行翻译
const handleTranslate = async () => {
  translating.value = true;
  translateProgress.value = 0;

  try {
    // 模拟进度更新
    const progressInterval = setInterval(() => {
      if (translateProgress.value < 90) {
        translateProgress.value += 10;
      }
    }, 500);

    const result = await apiService.translate(sessionId.value, selectedModName.value);
    
    clearInterval(progressInterval);
    translateProgress.value = 100;

    translationResult.value = result.result;
    currentStep.value = 3;
    ElMessage.success('翻译完成');
  } catch (error) {
    ElMessage.error('翻译失败: ' + error.message);
  } finally {
    translating.value = false;
  }
};

// 翻译内容变更
const handleTranslationChange = (index, translation) => {
  if (translationResult.value[index]) {
    translationResult.value[index].translation = translation;
  }
};

// 返回上一步
const handleBack = () => {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
};

// 重置
const handleReset = () => {
  currentStep.value = 0;
  sessionId.value = '';
  langFiles.value = [];
  selectedModName.value = '';
  langEntries.value = [];
  translationResult.value = [];
  translateProgress.value = 0;
};
</script>

<style scoped>
.translate-view {
  width: 100%;
  max-width: none;
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.steps-card {
  margin: 0 auto 30px;
  width: 100%;
  max-width: 1400px;
  border-radius: 16px;
  border: none;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.modern-steps {
  padding: 20px 40px;
  width: 100%;
}

.modern-steps :deep(.el-step__head) {
  font-size: 20px;
}

.modern-steps :deep(.el-step__title) {
  font-size: 16px;
  font-weight: 500;
}

.step-card {
  margin: 20px auto 0;
  max-width: 1000px;
  animation: slideUp 0.5s ease-out;
}

.modern-card {
  border-radius: 16px;
  border: none;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
  transition: all 0.3s ease;
  width: 100%;
}

.modern-card:hover {
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  justify-content: space-between;
}

.header-icon {
  font-size: 24px;
  color: #409eff;
}

.mod-radio-group {
  width: 100%;
}

.custom-radio-item {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  padding: 15px;
  border: 2px solid #dcdfe6;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.custom-radio-item:hover {
  border-color: #409eff;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  transform: translateX(5px);
}

.custom-radio-item.selected {
  border-color: #409eff;
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  color: white;
}

.radio-input-wrapper {
  margin-right: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.custom-radio {
  width: 20px;
  height: 20px;
  border: 2px solid #dcdfe6;
  border-radius: 50%;
  position: relative;
  transition: all 0.3s ease;
}

.custom-radio.checked {
  border-color: #409eff;
  background: #409eff;
}

.custom-radio.checked::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 50%;
}

.selected .custom-radio {
  border-color: white;
  background: white;
}

.selected .custom-radio.checked {
  border-color: white;
  background: white;
}

.selected .custom-radio.checked::after {
  background: #409eff;
}

.selected .mod-name {
  color: white;
}

.selected .mod-count {
  color: rgba(255, 255, 255, 0.8);
}

.selected .mod-icon {
  color: white;
}

.mod-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.mod-icon {
  font-size: 32px;
  color: #409eff;
}

.mod-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 5px;
}

.mod-count {
  font-size: 14px;
  color: #909399;
}

.action-buttons {
  margin-top: 30px;
  display: flex;
  gap: 20px;
  justify-content: center;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.action-button {
  padding: 12px 30px;
  border-radius: 10px;
  font-size: 16px;
  min-width: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.translate-button {
  padding: 10px 25px;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
  transition: all 0.3s ease;
}

.translate-button:hover {
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.4);
  transform: translateY(-2px);
}

.info-alert {
  margin-bottom: 20px;
  border-radius: 10px;
  border: none;
}

.progress-container {
  margin-bottom: 25px;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 12px;
}

.modern-progress {
  margin-bottom: 10px;
}

.progress-text {
  text-align: center;
  color: #606266;
  font-size: 14px;
  margin-top: 10px;
}

.translate-prompt {
  text-align: center;
  padding: 60px 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 16px;
  margin: 20px 0;
}

.prompt-icon {
  font-size: 64px;
  color: #409eff;
  margin-bottom: 20px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.translate-prompt p {
  font-size: 18px;
  color: #606266;
  margin-bottom: 30px;
}

.start-button {
  padding: 15px 40px;
  font-size: 18px;
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(64, 158, 255, 0.4);
  transition: all 0.3s ease;
}

.start-button:hover {
  box-shadow: 0 8px 24px rgba(64, 158, 255, 0.5);
  transform: translateY(-3px);
}

.success-content {
  margin: 20px 0;
}

.success-result {
  margin-bottom: 30px;
}

.success-icon-wrapper {
  width: 80px;
  height: 80px;
  margin: 0 auto;
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(103, 194, 58, 0.3);
  animation: scaleIn 0.5s ease-out;
}

@keyframes scaleIn {
  from {
    transform: scale(0);
  }
  to {
    transform: scale(1);
  }
}

.success-icon {
  font-size: 48px;
  color: white;
}

.result-table {
  margin-top: 20px;
}
</style>

