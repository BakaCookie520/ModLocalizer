<template>
  <div class="config-view">
    <section class="config-panel">
      <header class="config-header">
        <span class="header-icon">
          <el-icon><Setting /></el-icon>
        </span>
        <div>
          <p class="eyebrow">OpenAI compatible endpoint</p>
          <h2>模型配置</h2>
        </div>
      </header>

      <el-alert
        v-if="configStatus.configured"
        title="配置已保存，可以回到翻译任务上传 Mod。"
        type="success"
        :closable="false"
        show-icon
      />

      <el-form
        ref="configFormRef"
        :model="configForm"
        :rules="rules"
        label-position="top"
        class="config-form"
      >
        <el-form-item label="API Key" prop="apiKey">
          <el-input
            v-model="configForm.apiKey"
            type="password"
            show-password
            placeholder="请输入 API Key"
            clearable
            size="large"
          >
            <template #prefix>
              <el-icon><Key /></el-icon>
            </template>
          </el-input>
          <p class="field-tip">支持 OpenAI 兼容接口。密钥只保存在本地后端配置文件中。</p>
        </el-form-item>

        <el-form-item label="模型名称" prop="model">
          <el-input
            v-model="configForm.model"
            placeholder="例如：gpt-4o-mini"
            clearable
            size="large"
          >
            <template #prefix>
              <el-icon><Cpu /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="API Base URL" prop="apiBaseUrl">
          <el-input
            v-model="configForm.apiBaseUrl"
            placeholder="https://api.openai.com/v1"
            clearable
            size="large"
          >
            <template #prefix>
              <el-icon><Link /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <div class="form-actions">
          <el-button type="primary" size="large" :loading="saving" @click="handleSave">
            <el-icon v-if="!saving"><Check /></el-icon>
            保存配置
          </el-button>
          <el-button size="large" @click="handleReset">
            <el-icon><RefreshLeft /></el-icon>
            重置
          </el-button>
        </div>
      </el-form>
    </section>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Check, Cpu, Key, Link, RefreshLeft, Setting } from '@element-plus/icons-vue';
import apiService from '../api';

const configFormRef = ref(null);
const saving = ref(false);
const configStatus = ref({ configured: false });

const configForm = reactive({
  apiKey: '',
  model: 'gpt-4o-mini',
  apiBaseUrl: 'https://api.openai.com/v1'
});

const rules = {
  apiKey: [{ required: true, message: '请输入 API Key', trigger: 'blur' }],
  model: [{ required: true, message: '请输入模型名称', trigger: 'blur' }],
  apiBaseUrl: [{ required: true, message: '请输入 API Base URL', trigger: 'blur' }]
};

const loadConfig = async () => {
  try {
    const config = await apiService.getConfig();
    configForm.apiKey = config.apiKey || '';
    configForm.model = config.model || 'gpt-4o-mini';
    configForm.apiBaseUrl = config.apiBaseUrl || 'https://api.openai.com/v1';
    configStatus.value.configured = Boolean(config.configured);
  } catch (error) {
    ElMessage.error(`读取配置失败：${error.message}`);
  }
};

const handleSave = async () => {
  if (!configFormRef.value) return;

  const valid = await configFormRef.value.validate().catch(() => false);
  if (!valid) return;

  saving.value = true;
  try {
    await apiService.saveConfig(configForm);
    configStatus.value.configured = true;
    ElMessage.success('配置已保存');
  } catch (error) {
    ElMessage.error(`保存失败：${error.message}`);
  } finally {
    saving.value = false;
  }
};

const handleReset = async () => {
  configFormRef.value?.clearValidate();
  await loadConfig();
};

onMounted(loadConfig);
</script>

<style scoped>
.config-view {
  max-width: 760px;
}

.config-panel {
  display: grid;
  gap: 20px;
  padding: 24px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--panel);
  box-shadow: var(--shadow);
}

.config-header {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr);
  align-items: center;
  gap: 14px;
}

.header-icon {
  display: inline-grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 8px;
  background: var(--primary-weak);
  color: var(--primary);
  font-size: 26px;
}

.config-header h2 {
  margin: 0;
  font-size: 24px;
}

.config-form {
  display: grid;
  gap: 4px;
}

.field-tip {
  margin: 8px 0 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.5;
}

.form-actions {
  display: flex;
  gap: 10px;
  padding-top: 8px;
}

@media (max-width: 700px) {
  .config-panel {
    padding: 18px;
  }

  .form-actions {
    flex-direction: column;
  }
}
</style>
