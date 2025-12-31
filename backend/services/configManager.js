import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG_FILE = path.join(__dirname, '../config.json');

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
 * 验证配置
 */
export async function validateConfig() {
  const config = await getConfig();
  if (!config.configured || !config.apiKey || !config.model) {
    return { valid: false, message: '请先配置API Key和模型名称' };
  }
  return { valid: true };
}

