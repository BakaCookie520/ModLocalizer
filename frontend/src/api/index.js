import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 300000 // 5分钟超时，因为翻译可能需要较长时间
});

// 请求拦截器
api.interceptors.request.use(
  config => {
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  response => {
    // 如果是blob响应，直接返回
    if (response.config.responseType === 'blob') {
      // 检查Content-Type，如果是JSON说明是错误响应
      const contentType = response.headers['content-type'];
      if (contentType && contentType.includes('application/json')) {
        // 将blob转换为文本并解析JSON
        return response.data.text().then(text => {
          try {
            const errorData = JSON.parse(text);
            return Promise.reject(new Error(errorData.error || '下载失败'));
          } catch {
            return Promise.reject(new Error('下载失败'));
          }
        });
      }
      return response.data;
    }
    return response.data;
  },
  async error => {
    // 处理blob错误响应
    if (error.config?.responseType === 'blob' && error.response?.data) {
      try {
        const text = await error.response.data.text();
        const errorData = JSON.parse(text);
        return Promise.reject(new Error(errorData.error || '下载失败'));
      } catch {
        return Promise.reject(new Error('下载失败'));
      }
    }
    const message = error.response?.data?.error || error.message || '请求失败';
    return Promise.reject(new Error(message));
  }
);

// API方法
export const apiService = {
  // 获取配置
  getConfig() {
    return api.get('/config');
  },

  // 保存配置
  saveConfig(config) {
    return api.post('/config', config);
  },

  // 上传mod文件
  uploadModFile(file) {
    const formData = new FormData();
    formData.append('modFile', file);
    return api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  // 获取lang文件内容
  getLangContent(sessionId, modName) {
    return api.get(`/lang/${sessionId}/${modName}`);
  },

  // 执行翻译
  translate(sessionId, modName) {
    return api.post('/translate', { sessionId, modName });
  },

  // 下载文件
  downloadMod(sessionId) {
    return api.get(`/download/mod/${sessionId}`, {
      responseType: 'blob'
    });
  },

  downloadLang(sessionId, modName) {
    return api.get(`/download/lang/${sessionId}/${modName}`, {
      responseType: 'blob'
    });
  }
};

export default apiService;

