import AdmZip from 'adm-zip';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMP_DIR = path.join(__dirname, '../temp');
const UPLOADS_DIR = path.join(__dirname, '../uploads');

/**
 * 处理上传的mod文件
 */
export async function processModFile(filePath, originalFileName) {
  try {
    // 确保临时目录存在
    await fs.ensureDir(TEMP_DIR);
    
    // 创建唯一的工作目录
    const workDir = path.join(TEMP_DIR, `mod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    await fs.ensureDir(workDir);
    
    // 解压jar文件
    const zip = new AdmZip(filePath);
    zip.extractAllTo(workDir, true);
    
    // 查找en_us.json文件
    const langFiles = findLangFiles(workDir);
    
    if (langFiles.length === 0) {
      throw new Error('未找到en_us.json文件，请确保mod文件包含assets/*/lang/en_us.json');
    }
    
    // 读取所有找到的lang文件
    const langData = {};
    for (const langFile of langFiles) {
      const content = await fs.readFile(langFile.path, 'utf-8');
      const jsonData = JSON.parse(content);
      langData[langFile.modName] = {
        path: langFile.path,
        relativePath: langFile.relativePath,
        data: jsonData,
        modName: langFile.modName
      };
    }
    
    return {
      success: true,
      workDir,
      originalFileName,
      langFiles: langData
    };
  } catch (error) {
    console.error('处理mod文件失败:', error);
    throw error;
  }
}

/**
 * 查找lang文件
 */
function findLangFiles(rootDir) {
  const langFiles = [];
  
  function searchDir(dir, relativePath = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const currentRelativePath = path.join(relativePath, entry.name);
      
      if (entry.isDirectory()) {
        searchDir(fullPath, currentRelativePath);
      } else if (entry.name === 'en_us.json') {
        // 检查路径是否符合 assets/{mod_name}/lang/en_us.json
        // 使用标准化路径分隔符
        const normalizedPath = currentRelativePath.replace(/\\/g, '/');
        const pathParts = normalizedPath.split('/');
        const assetsIndex = pathParts.indexOf('assets');
        
        if (assetsIndex !== -1 && pathParts.length > assetsIndex + 2) {
          const modName = pathParts[assetsIndex + 1];
          const langDir = pathParts[assetsIndex + 2];
          
          if (langDir === 'lang') {
            langFiles.push({
              path: fullPath,
              relativePath: normalizedPath, // 使用标准化路径
              modName: modName
            });
          }
        }
      }
    }
  }
  
  searchDir(rootDir);
  return langFiles;
}

/**
 * 创建翻译后的lang文件
 */
export async function createTranslatedLangFile(workDir, modName, originalLangPath, translations) {
  try {
    // 构建zh_cn.json的路径
    const langDir = path.dirname(originalLangPath);
    const zhCnPath = path.join(langDir, 'zh_cn.json');
    
    // 创建翻译后的JSON对象
    const translatedData = {};
    for (const [key, value] of Object.entries(translations)) {
      translatedData[key] = value.translation || value.original;
    }
    
    // 写入文件
    await fs.writeJson(zhCnPath, translatedData, { spaces: 2 });
    
    return zhCnPath;
  } catch (error) {
    console.error('创建翻译文件失败:', error);
    throw error;
  }
}

/**
 * 打包mod文件
 */
export async function packageModFile(workDir, originalFileName) {
  try {
    const zip = new AdmZip();
    
    // 添加工作目录中的所有文件
    function addFilesToZip(dir, zipPath = '') {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        // 确保zip路径使用正斜杠
        const normalizedZipPath = zipPath.replace(/\\/g, '/');
        const zipEntryPath = normalizedZipPath ? `${normalizedZipPath}/${entry.name}` : entry.name;
        
        if (entry.isDirectory()) {
          addFilesToZip(fullPath, zipEntryPath);
        } else {
          // 使用相对路径添加文件
          const relativePath = path.relative(workDir, fullPath).replace(/\\/g, '/');
          zip.addFile(relativePath, fs.readFileSync(fullPath));
        }
      }
    }
    
    addFilesToZip(workDir);
    
    // 生成输出文件名
    const outputFileName = originalFileName.replace(/\.jar$/, '_zh_cn.jar');
    const outputPath = path.join(UPLOADS_DIR, outputFileName);
    
    // 确保上传目录存在
    await fs.ensureDir(UPLOADS_DIR);
    
    // 写入zip文件
    zip.writeZip(outputPath);
    
    return outputPath;
  } catch (error) {
    console.error('打包mod文件失败:', error);
    throw error;
  }
}

/**
 * 创建单独的lang文件zip
 */
export async function createLangFileZip(workDir, modName, langFilePath) {
  try {
    const zip = new AdmZip();
    
    // 添加zh_cn.json文件
    const langDir = path.dirname(langFilePath);
    const zhCnPath = path.join(langDir, 'zh_cn.json');
    
    if (await fs.pathExists(zhCnPath)) {
      // 计算相对路径，确保使用正斜杠
      const relativePath = path.relative(workDir, zhCnPath).replace(/\\/g, '/');
      const zipEntryPath = relativePath;
      
      // 读取文件内容并添加到zip
      const fileContent = await fs.readFile(zhCnPath);
      zip.addFile(zipEntryPath, fileContent);
      
      const outputFileName = `${modName}_zh_cn_lang.zip`;
      const outputPath = path.join(UPLOADS_DIR, outputFileName);
      
      await fs.ensureDir(UPLOADS_DIR);
      zip.writeZip(outputPath);
      
      return outputPath;
    } else {
      throw new Error('未找到zh_cn.json文件');
    }
  } catch (error) {
    console.error('创建lang文件zip失败:', error);
    throw error;
  }
}

/**
 * 清理临时文件
 */
export async function cleanupTempFiles(workDir) {
  try {
    if (await fs.pathExists(workDir)) {
      await fs.remove(workDir);
    }
  } catch (error) {
    console.error('清理临时文件失败:', error);
  }
}

