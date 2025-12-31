<template>
  <div class="config-view">
    <el-card class="modern-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon class="header-icon"><Setting /></el-icon>
          <span>API配置</span>
        </div>
      </template>

      <el-form
        :model="configForm"
        :rules="rules"
        ref="configFormRef"
        label-width="140px"
        label-position="left"
        class="modern-form"
      >
        <el-form-item label="API Key" prop="apiKey">
          <el-input
            v-model="configForm.apiKey"
            type="password"
            show-password
            placeholder="请输入API Key"
            clearable
            size="large"
            class="modern-input"
          >
            <template #prefix>
              <el-icon><Key /></el-icon>
            </template>
          </el-input>
          <div class="form-tip">
            <el-icon><InfoFilled /></el-icon>
            支持OpenAI格式的API，如OpenAI、Azure OpenAI等
          </div>
        </el-form-item>

        <el-form-item label="模型名称" prop="model">
          <el-input
            v-model="configForm.model"
            placeholder="例如: gpt-3.5-turbo, gpt-4"
            clearable
            size="large"
            class="modern-input"
          >
            <template #prefix>
              <el-icon><Cpu /></el-icon>
            </template>
          </el-input>
          <div class="form-tip">
            <el-icon><InfoFilled /></el-icon>
            默认: gpt-3.5-turbo
          </div>
        </el-form-item>

        <el-form-item label="API Base URL" prop="apiBaseUrl">
          <el-input
            v-model="configForm.apiBaseUrl"
            placeholder="https://api.openai.com/v1"
            clearable
            size="large"
            class="modern-input"
          >
            <template #prefix>
              <el-icon><Link /></el-icon>
            </template>
          </el-input>
          <div class="form-tip">
            <el-icon><InfoFilled /></el-icon>
            默认: https://api.openai.com/v1（使用OpenAI时无需修改）
          </div>
        </el-form-item>

        <el-form-item>
          <el-button 
            type="primary" 
            @click="handleSave" 
            :loading="saving"
            size="large"
            class="save-button"
          >
            <el-icon v-if="!saving"><Check /></el-icon>
            <span>保存配置</span>
          </el-button>
          <el-button 
            @click="handleReset"
            size="large"
          >
            <el-icon><RefreshLeft /></el-icon>
            <span>重置</span>
          </el-button>

        </el-form-item>
      </el-form>

      <el-alert
        v-if="configStatus.configured"
        title="配置已保存"
        type="success"
        :closable="false"
        class="success-alert"
        show-icon
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Setting, Key, Cpu, Link, InfoFilled, Check, RefreshLeft } from '@element-plus/icons-vue';
import apiService from '../api';

const configFormRef = ref(null);
const saving = ref(false);
const configStatus = ref({ configured: false });

const configForm = reactive({
  apiKey: '',
  model: 'gpt-3.5-turbo',
  apiBaseUrl: 'https://api.openai.com/v1'
});

const rules = {
  apiKey: [
    { required: true, message: '请输入API Key', trigger: 'blur' }
  ],
  model: [
    { required: true, message: '请输入模型名称', trigger: 'blur' }
  ],
  apiBaseUrl: [
    { required: true, message: '请输入API Base URL', trigger: 'blur' }
  ]
};



// 加载配置
const loadConfig = async () => {
  try {
    const config = await apiService.getConfig();
    if (config.configured) {
      configForm.apiKey = config.apiKey || '';
      configForm.model = config.model || 'gpt-3.5-turbo';
      configForm.apiBaseUrl = config.apiBaseUrl || 'https://api.openai.com/v1';
      configStatus.value.configured = true;
    }
  } catch (error) {
    console.error('加载配置失败:', error);
  }
};

// 保存配置
const handleSave = async () => {
  if (!configFormRef.value) return;
  
  await configFormRef.value.validate(async (valid) => {
    if (valid) {
      saving.value = true;
      try {
        await apiService.saveConfig(configForm);
        ElMessage.success('配置保存成功');
        configStatus.value.configured = true;
      } catch (error) {
        ElMessage.error('保存失败: ' + error.message);
      } finally {
        saving.value = false;
      }
    }
  });
};

// 重置表单
const handleReset = () => {
  configFormRef.value?.resetFields();
  loadConfig();
};

onMounted(() => {
  loadConfig();
});
</script>

<style scoped>
.config-view {
  max-width: 700px;
  margin: 0 auto;
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modern-card {
  border-radius: 16px;
  border: none;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
  transition: all 0.3s ease;
}

.modern-card:hover {
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.header-icon {
  font-size: 24px;
  color: #409eff;
}

.modern-form {
  padding: 10px 0;
}

.modern-input {
  transition: all 0.3s ease;
}

.modern-input :deep(.el-input__wrapper) {
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.modern-input :deep(.el-input__wrapper:hover) {
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.modern-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.3);
}

.form-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #909399;
  margin-top: 8px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 8px;
}

.form-tip .el-icon {
  font-size: 14px;
  color: #409eff;
}

.save-button {
  padding: 12px 30px;
  font-size: 16px;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
  transition: all 0.3s ease;
}

.save-button:hover {
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.4);
  transform: translateY(-2px);
}

.success-alert {
  margin-top: 20px;
  border-radius: 10px;
  border: none;
  box-shadow: 0 2px 8px rgba(103, 194, 58, 0.2);
}


</style>

