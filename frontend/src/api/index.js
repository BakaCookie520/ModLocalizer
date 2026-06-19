import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 300000
});

api.interceptors.response.use(
  async (response) => {
    if (response.config.responseType === 'blob') {
      const contentType = response.headers['content-type'];
      if (contentType && contentType.includes('application/json')) {
        const text = await response.data.text();
        try {
          const errorData = JSON.parse(text);
          return Promise.reject(new Error(errorData.error || '下载失败'));
        } catch {
          return Promise.reject(new Error('下载失败'));
        }
      }
      return response.data;
    }

    return response.data;
  },
  async (error) => {
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

export const apiService = {
  getConfig() {
    return api.get('/config');
  },

  saveConfig(config) {
    return api.post('/config', config);
  },

  uploadModFile(file) {
    const formData = new FormData();
    formData.append('modFile', file);
    return api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  getLangContent(sessionId, modName) {
    return api.get(`/lang/${sessionId}/${encodeURIComponent(modName)}`);
  },

  translate(sessionId, modName) {
    return api.post('/translate', { sessionId, modName });
  },

  getTranslateProgress(sessionId, modName) {
    return api.get(`/translate/progress/${sessionId}/${encodeURIComponent(modName)}`);
  },

  updateTranslations(sessionId, modName, entries) {
    return api.post('/translation/update', { sessionId, modName, entries });
  },

  downloadMod(sessionId) {
    return api.get(`/download/mod/${sessionId}`, {
      responseType: 'blob'
    });
  },

  downloadLang(sessionId, modName) {
    return api.get(`/download/lang/${sessionId}/${encodeURIComponent(modName)}`, {
      responseType: 'blob'
    });
  }
};

export default apiService;
