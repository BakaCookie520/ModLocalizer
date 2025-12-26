# 快速开始指南

## 安装和启动

### 1. 安装依赖

```bash
npm run install:all
```

### 2. 启动后端

```bash
npm run dev:backend
```

后端将在 `http://localhost:3000` 启动

### 3. 启动前端（新终端窗口）

```bash
npm run dev:frontend
```

前端将在 `http://localhost:5173` 启动

### 4. 访问应用

在浏览器中打开 `http://localhost:5173`

## 首次使用

1. 点击"配置"菜单
2. 填写您的API配置：
   - **API Key**: 您的OpenAI API密钥（或其他兼容API的密钥）
   - **模型名称**: 如 `gpt-3.5-turbo` 或 `gpt-4`
   - **API Base URL**: 默认 `https://api.openai.com/v1`（使用OpenAI时无需修改）
3. 点击"保存配置"

## 使用流程

1. **上传Mod**: 在翻译页面拖拽或选择`.jar`文件
2. **选择模组**: 如果mod包含多个模组，选择要翻译的
3. **开始翻译**: 点击"开始翻译"按钮，等待完成
4. **编辑翻译**: 可以手动编辑翻译结果
5. **下载**: 选择下载打包mod或单独lang文件

## 常见问题

### 后端启动失败

- 检查端口3000是否被占用
- 确保已安装所有依赖：`cd backend && npm install`

### 前端启动失败

- 检查端口5173是否被占用
- 确保已安装所有依赖：`cd frontend && npm install`

### 翻译失败

- 检查API Key是否正确
- 检查网络连接
- 查看浏览器控制台和后端日志

### 找不到en_us.json

- 确保mod文件是标准的Minecraft mod格式
- 确保mod包含 `assets/{mod_name}/lang/en_us.json` 结构

