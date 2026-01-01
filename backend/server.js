import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 检测是否在pkg打包环境中运行
const isPkg = typeof process.pkg !== 'undefined';

// 根据环境确定静态文件路径
let staticPath;
if (isPkg) {
  // 在pkg打包环境中，使用解压后的assets路径
  staticPath = path.join(process.cwd(), 'frontend/dist');
} else {
  // 开发环境使用相对路径
  staticPath = path.join(__dirname, '../frontend/dist');
}

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务（用于服务前端构建产物）
app.use(express.static(staticPath));

// API路由
app.use('/api', apiRoutes);

// 前端路由（SPA支持）
app.get('*', (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`API端点: http://localhost:${PORT}/api`);
});

