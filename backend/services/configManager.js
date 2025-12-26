import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG_FILE = path.join(__dirname, '../config.json');
const PASSWORD_FILE = path.join(__dirname, '../password.json');

// 默认密码（仅在首次设置时使用）
const DEFAULT_PASSWORD = 'admin123';

/**
 * 获取配置
 */
export async function getConfig() {
  try {
    if (await fs.pathExists(CONFIG_FILE)) {
      const config = await fs.readJson(CONFIG_FILE);
      return {
        configured: true,
        apiKey: config.apiKey || '',
        model: config.model || 'gpt-3.5-turbo',
        apiBaseUrl: config.apiBaseUrl || 'https://api.openai.com/v1'
      };
    }
    return {
      configured: false,
      apiKey: '',
      model: 'gpt-3.5-turbo',
      apiBaseUrl: 'https://api.openai.com/v1'
    };
  } catch (error) {
    console.error('读取配置失败:', error);
    return {
      configured: false,
      apiKey: '',
      model: 'gpt-3.5-turbo',
      apiBaseUrl: 'https://api.openai.com/v1'
    };
  }
}

/**
 * 保存配置
 */
export async function saveConfig(config) {
  try {
    const configData = {
      apiKey: config.apiKey || '',
      model: config.model || 'gpt-3.5-turbo',
      apiBaseUrl: config.apiBaseUrl || 'https://api.openai.com/v1',
      updatedAt: new Date().toISOString()
    };
    
    await fs.writeJson(CONFIG_FILE, configData, { spaces: 2 });
    return { success: true };
  } catch (error) {
    console.error('保存配置失败:', error);
    throw new Error('保存配置失败: ' + error.message);
  }
}

/**
 * 获取密码配置
 */
export async function getPasswordConfig() {
  try {
    if (await fs.pathExists(PASSWORD_FILE)) {
      const passwordConfig = await fs.readJson(PASSWORD_FILE);
      return {
        hasPassword: true,
        passwordHash: passwordConfig.passwordHash || DEFAULT_PASSWORD,
        isDefaultPassword: passwordConfig.passwordHash === Buffer.from(DEFAULT_PASSWORD).toString('base64')
      };
    }
    // 如果没有密码文件，不自动创建，由前端引导用户设置
    return {
      hasPassword: false,
      passwordHash: DEFAULT_PASSWORD,
      isDefaultPassword: false
    };
  } catch (error) {
    console.error('读取密码配置失败:', error);
    return {
      hasPassword: false,
      passwordHash: DEFAULT_PASSWORD,
      isDefaultPassword: false
    };
  }
}

/**
 * 保存密码
 */
export async function savePassword(password) {
  try {
    // 简单的密码哈希（实际应用中应该使用bcrypt等更安全的方式）
    const passwordHash = Buffer.from(password).toString('base64');
    
    const passwordData = {
      passwordHash: passwordHash,
      updatedAt: new Date().toISOString()
    };
    
    await fs.writeJson(PASSWORD_FILE, passwordData, { spaces: 2 });
    return { success: true };
  } catch (error) {
    console.error('保存密码失败:', error);
    throw new Error('保存密码失败: ' + error.message);
  }
}

/**
 * 验证密码
 */
export async function verifyPassword(inputPassword) {
  try {
    const passwordConfig = await getPasswordConfig();
    
    if (!passwordConfig.hasPassword) {
      return { success: true };
    }
    
    // 解码存储的密码哈希进行比较
    const storedHash = passwordConfig.passwordHash;
    const inputHash = Buffer.from(inputPassword).toString('base64');
    
    return { 
      success: storedHash === inputHash,
      isDefaultPassword: storedHash === Buffer.from(DEFAULT_PASSWORD).toString('base64')
    };
  } catch (error) {
    console.error('验证密码失败:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 检查是否需要首次设置
 */
export async function checkNeedSetup() {
  try {
    // 如果密码文件不存在，说明需要首次设置
    if (!await fs.pathExists(PASSWORD_FILE)) {
      return { needSetup: true };
    }

    const passwordConfig = await getPasswordConfig();
    // 如果是默认密码，说明需要首次设置
    return {
      needSetup: passwordConfig.isDefaultPassword || false
    };
  } catch (error) {
    console.error('检查设置状态失败:', error);
    return { needSetup: true };
  }
}

/**
 * 验证配置
 */
export async function validateConfig() {
  const config = await getConfig();
  if (!config.configured || !config.apiKey || !config.model) {
    return { valid: false, message: '请先配置API Key和模型名称' };
  }
  return { valid: true };
}

