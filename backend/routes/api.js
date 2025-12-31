import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import { getConfig, saveConfig, validateConfig } from '../services/configManager.js';
import { processModFile, createTranslatedLangFile, packageModFile, createLangFileZip, cleanupTempFiles } from '../services/modProcessor.js';
import { translateJsonData } from '../services/llmService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const UPLOADS_DIR = path.join(__dirname, '../uploads');
const TEMP_DIR = path.join(__dirname, '../temp');

// 确保上传目录存在
fs.ensureDirSync(UPLOADS_DIR);
fs.ensureDirSync(TEMP_DIR);

// 配置multer用于文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/java-archive' || file.originalname.endsWith('.jar')) {
      cb(null, true);
    } else {
      cb(new Error('只支持.jar文件'));
    }
  }
});

// 处理multer错误
const uploadErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: '文件大小超过限制（最大100MB）' });
    }
    return res.status(400).json({ error: '文件上传错误: ' + err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

// 存储当前会话的数据
const sessionData = new Map();

// 获取配置
router.get('/config', async (req, res) => {
  try {
    const config = await getConfig();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 保存配置
router.post('/config', async (req, res) => {
  try {
    const { apiKey, model, apiBaseUrl } = req.body;
    
    if (!apiKey || !model) {
      return res.status(400).json({ error: 'API Key和模型名称不能为空' });
    }
    
    await saveConfig({ apiKey, model, apiBaseUrl });
    res.json({ success: true, message: '配置保存成功' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 上传mod文件
router.post('/upload', upload.single('modFile'), uploadErrorHandler, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传mod文件' });
    }
    
    // 验证配置
    const configValidation = await validateConfig();
    if (!configValidation.valid) {
      // 清理上传的文件
      try {
        await fs.remove(req.file.path);
      } catch (e) {
        // 忽略清理错误
      }
      return res.status(400).json({ error: configValidation.message });
    }
    
    // 处理mod文件
    const result = await processModFile(req.file.path, req.file.originalname);
    
    // 存储会话数据
    const sessionId = Date.now().toString();
    sessionData.set(sessionId, {
      workDir: result.workDir,
      originalFileName: result.originalFileName,
      langFiles: result.langFiles,
      uploadedAt: new Date().toISOString()
    });
    
    // 构建返回数据
    const responseData = {
      sessionId: sessionId,
      modName: result.originalFileName,
      langFiles: Object.keys(result.langFiles).map(modName => ({
        modName: modName,
        entryCount: Object.keys(result.langFiles[modName].data).length
      }))
    };
    
    res.json(responseData);
  } catch (error) {
    console.error('上传处理失败:', error);
    // 清理上传的文件
    if (req.file && req.file.path) {
      try {
        await fs.remove(req.file.path);
      } catch (e) {
        // 忽略清理错误
      }
    }
    res.status(500).json({ error: error.message || '上传处理失败' });
  }
});

// 获取lang文件内容
router.get('/lang/:sessionId/:modName', async (req, res) => {
  try {
    const { sessionId, modName } = req.params;
    const session = sessionData.get(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: '会话不存在或已过期' });
    }
    
    const langFile = session.langFiles[modName];
    if (!langFile) {
      return res.status(404).json({ error: '未找到指定的lang文件' });
    }
    
    // 构建条目数组
    const entries = Object.entries(langFile.data).map(([key, value]) => ({
      key: key,
      original: value,
      translation: ''
    }));
    
    res.json({
      modName: modName,
      entries: entries,
      total: entries.length
    });
  } catch (error) {
    console.error('获取lang内容失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 执行翻译
router.post('/translate', async (req, res) => {
  try {
    const { sessionId, modName } = req.body;
    
    if (!sessionId || !modName) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    const session = sessionData.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: '会话不存在或已过期' });
    }
    
    const langFile = session.langFiles[modName];
    if (!langFile) {
      return res.status(404).json({ error: '未找到指定的lang文件' });
    }
    
    // 执行翻译
    const translationResult = await translateJsonData(langFile.data, (progress) => {
      // 可以在这里实现WebSocket或SSE来推送进度
      console.log(`翻译进度: ${progress.percentage}%`);
    });
    
    // 创建翻译后的lang文件
    const translatedLangPath = await createTranslatedLangFile(
      session.workDir,
      modName,
      langFile.path,
      translationResult.resultArray.reduce((acc, item) => {
        acc[item.key] = {
          original: item.original,
          translation: item.translation
        };
        return acc;
      }, {})
    );
    
    // 更新会话数据
    session.translatedLangPath = translatedLangPath;
    session.translationResult = translationResult;
    sessionData.set(sessionId, session);
    
    res.json({
      success: true,
      result: translationResult.resultArray,
      total: translationResult.resultArray.length
    });
  } catch (error) {
    console.error('翻译失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 下载文件
router.get('/download/:type/:sessionId/:modName?', async (req, res) => {
  try {
    const { type, sessionId, modName } = req.params;
    const session = sessionData.get(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: '会话不存在或已过期' });
    }
    
    if (type === 'mod') {
      // 打包并下载mod文件
      const outputPath = await packageModFile(session.workDir, session.originalFileName);
      const fileName = path.basename(outputPath);
      
      res.download(outputPath, fileName, (err) => {
        if (err) {
          console.error('下载失败:', err);
        }
        // 可选：清理临时文件
        // cleanupTempFiles(session.workDir);
      });
    } else if (type === 'lang') {
      // 下载lang文件
      if (!modName) {
        return res.status(400).json({ error: '需要指定mod名称' });
      }
      
      const langFile = session.langFiles[modName];
      if (!langFile) {
        return res.status(404).json({ error: '未找到指定的lang文件' });
      }
      
      const outputPath = await createLangFileZip(
        session.workDir,
        modName,
        langFile.path
      );
      const fileName = path.basename(outputPath);
      
      res.download(outputPath, fileName, (err) => {
        if (err) {
          console.error('下载失败:', err);
        }
      });
    } else {
      res.status(400).json({ error: '无效的下载类型' });
    }
  } catch (error) {
    console.error('下载失败:', error);
    res.status(500).json({ error: error.message });
  }
});



export default router;

