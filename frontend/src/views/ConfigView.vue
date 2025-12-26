<template>
  <div class="config-view">
    <el-card class="modern-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon class="header-icon"><Lock /></el-icon>
          <span>{{ isFirstTimeSetup ? '首次设置 - 创建独立访问密码' : (passwordVerified ? 'API配置' : '输入独立访问密码') }}</span>
        </div>
      </template>

      <div v-if="!passwordVerified" class="password-setup">
        <el-alert
          title="欢迎使用MCMOD汉化工具"
          type="info"
          :closable="false"
          class="welcome-alert"
          show-icon
        >
          <template #default>
            <p><strong>此密码用于保护配置页面访问权限</strong></p>
            <p>请设置一个独立的强密码（至少4位），设置后每次访问配置页面都需要输入此密码。</p>
            <p style="color: #67c23a; font-size: 13px; margin-top: 8px;">💡 提示：这是独立的安全密码，请不要使用您的API Key</p>
          </template>
        </el-alert>
        
        <el-form
          v-if="isFirstTimeSetup"
          :model="passwordForm"
          :rules="passwordRules"
          ref="passwordFormRef"
          label-width="120px"
          label-position="left"
          class="modern-form"
        >
          <el-form-item label="设置密码" prop="newPassword">
            <el-input
              v-model="passwordForm.newPassword"
              type="password"
              show-password
              placeholder="请输入至少4位密码"
              clearable
              size="large"
              class="modern-input"
            >
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          
          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input
              v-model="passwordForm.confirmPassword"
              type="password"
              show-password
              placeholder="请再次输入密码"
              clearable
              size="large"
              class="modern-input"
            >
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          
          <el-form-item>
            <el-button 
              type="primary" 
              @click="setupInitialPassword" 
              :loading="saving"
              size="large"
              class="save-button"
            >
              <el-icon v-if="!saving"><Check /></el-icon>
              <span>设置密码并继续</span>
            </el-button>
          </el-form-item>
        </el-form>
        
        <el-form
          v-else
          :model="passwordForm"
          :rules="passwordRules"
          ref="passwordFormRef"
          label-width="120px"
          label-position="left"
          class="modern-form"
        >
          <el-form-item label="访问密码" prop="setupPassword">
            <el-input
              v-model="passwordForm.setupPassword"
              type="password"
              show-password
              placeholder="请输入访问密码"
              clearable
              size="large"
              class="modern-input"
            >
              <template #prefix>
                <el-icon><Key /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          
          <el-form-item>
            <el-button 
              type="primary" 
              @click="verifyPassword" 
              :loading="checkingPassword"
              size="large"
              class="save-button"
            >
              <el-icon v-if="!checkingPassword"><Check /></el-icon>
              <span>验证并进入</span>
            </el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <el-form
        v-else
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
          <el-button 
            @click="logout"
            size="large"
            type="warning"
          >
            <el-icon><SwitchButton /></el-icon>
            <span>退出验证</span>
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
import { Setting, Key, Cpu, Link, InfoFilled, Check, RefreshLeft, Lock, SwitchButton, Search } from '@element-plus/icons-vue';
import apiService from '../api';

const configFormRef = ref(null);
const saving = ref(false);
const configStatus = ref({ configured: false });
const isFirstTimeSetup = ref(false);
const passwordVerified = ref(false);
const checkingPassword = ref(false);

const configForm = reactive({
  apiKey: '',
  model: 'gpt-3.5-turbo',
  apiBaseUrl: 'https://api.openai.com/v1'
});

const passwordForm = reactive({
  newPassword: '',
  confirmPassword: '',
  setupPassword: ''
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

const passwordRules = {
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 4, message: '密码长度至少4位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ],
  setupPassword: [
    { required: true, message: '请输入访问密码', trigger: 'blur' },
    { min: 4, message: '密码长度至少4位', trigger: 'blur' }
  ]
};

// 检查是否为首次使用
const checkFirstTimeSetup = async () => {
  try {
    const response = await fetch('/api/admin/check-setup', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const result = await response.json();
    isFirstTimeSetup.value = result.needSetup;
    if (!result.needSetup) {
      passwordVerified.value = true;
      loadConfig();
    }
  } catch (error) {
    console.error('检查设置状态失败:', error);
    // 如果检查失败，默认需要设置密码
    isFirstTimeSetup.value = true;
  }
};

// 验证访问密码
const verifyPassword = async () => {
  if (!passwordForm.setupPassword) {
    ElMessage.error('请输入访问密码');
    return;
  }
  
  checkingPassword.value = true;
  try {
    const response = await fetch('/api/admin/verify-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password: passwordForm.setupPassword })
    });
    const result = await response.json();
    
    if (result.success) {
      passwordVerified.value = true;
      loadConfig();
      ElMessage.success('验证成功');
    } else {
      ElMessage.error('密码错误');
    }
  } catch (error) {
    console.error('验证密码失败:', error);
    ElMessage.error('验证失败');
  } finally {
    checkingPassword.value = false;
  }
};

// 设置初始密码
const setupInitialPassword = async () => {
  if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
    ElMessage.error('请填写完整密码信息');
    return;
  }
  
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.error('两次输入的密码不一致');
    return;
  }
  
  saving.value = true;
  try {
    const response = await fetch('/api/admin/setup-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password: passwordForm.newPassword })
    });
    const result = await response.json();
    
    if (result.success) {
      ElMessage.success('密码设置成功');
      passwordVerified.value = true;
      isFirstTimeSetup.value = false;
      // 清空密码表单
      passwordForm.newPassword = '';
      passwordForm.confirmPassword = '';
      passwordForm.setupPassword = '';
    } else {
      ElMessage.error('设置失败: ' + result.message);
    }
  } catch (error) {
    console.error('设置密码失败:', error);
    ElMessage.error('设置失败');
  } finally {
    saving.value = false;
  }
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

// 退出验证
const logout = () => {
  passwordVerified.value = false;
  passwordForm.setupPassword = '';
  ElMessage.info('已退出验证状态');
};

onMounted(() => {
  checkFirstTimeSetup();
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

.password-setup {
  margin-bottom: 30px;
}

.welcome-alert {
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
  margin-bottom: 25px;
}

.welcome-alert :deep(.el-alert__title) {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.welcome-alert :deep(.el-alert__description) {
  font-size: 14px;
  line-height: 1.6;
}

.welcome-alert p {
  margin: 8px 0;
}
</style>

