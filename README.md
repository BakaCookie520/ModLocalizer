# MCMOD汉化工具

![Logo](logo.jpg)

一个基于Vue 3和Node.js的Minecraft模组自动汉化工具，使用LLM（大语言模型）进行翻译。

## 功能特性

- 🚀 自动提取mod文件中的`en_us.json`语言文件
- 🤖 使用LLM（支持OpenAI格式API）进行智能翻译
- 📝 支持手动编辑翻译结果
- 📦 支持下载打包好的mod文件或单独的lang文件
- 🎨 现代化的Web界面，操作简单直观

## 技术栈

- **前端**: Vue 3 + Vite + Element Plus
- **后端**: Node.js + Express
- **文件处理**: adm-zip
- **LLM调用**: OpenAI SDK（支持OpenAI格式API）

## 安装步骤

### 1. 克隆项目

```bash
git clone https://github.com/BakaCookie520/ModLocalizer.git
cd ModLocalizer-
```

### 2. 安装依赖

```bash
# 安装所有依赖（包括前端和后端）
npm run install:all

# 或者分别安装
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 3. 配置API

首次使用需要在配置页面填写：
- **API Key**: 您的LLM API密钥
- **模型名称**: 使用的模型名称（如：gpt-3.5-turbo, gpt-4）
- **API Base URL**: API基础URL（默认：https://api.openai.com/v1）

支持的API格式：
- OpenAI官方API
- Azure OpenAI
- 其他兼容OpenAI格式的API服务

## 使用方法

### 1. 启动后端服务

```bash
npm run dev:backend
```

后端服务将在 `http://localhost:3000` 启动

### 2. 启动前端开发服务器

```bash
npm run dev:frontend
```

前端将在 `http://localhost:5173` 启动

### 3. 使用流程

1. **配置API**
   - 访问配置页面
   - 填写API Key和模型名称
   - 点击保存

2. **上传Mod文件**
   - 访问翻译页面
   - 拖拽或选择`.jar`格式的mod文件
   - 点击"上传并处理"

3. **选择模组**
   - 如果mod包含多个模组，选择要翻译的模组
   - 点击"加载内容"

4. **执行翻译**
   - 查看需要翻译的条目
   - 点击"开始翻译"
   - 等待翻译完成（会显示进度）

5. **编辑和下载**
   - 查看翻译结果
   - 可以手动编辑翻译内容
   - 选择下载方式：
     - **下载打包Mod**: 下载包含翻译文件的完整mod
     - **下载Lang文件**: 仅下载翻译后的lang文件

## 项目结构

```
ModLocalizer-/
├── frontend/              # Vue前端项目
│   ├── src/
│   │   ├── components/    # Vue组件
│   │   ├── views/         # 页面视图
│   │   ├── api/           # API调用
│   │   └── App.vue
│   └── package.json
├── backend/               # Node.js后端项目
│   ├── routes/            # 路由处理
│   ├── services/          # 业务逻辑
│   │   ├── modProcessor.js    # mod文件处理
│   │   ├── llmService.js      # LLM调用服务
│   │   └── configManager.js   # 配置管理
│   ├── utils/             # 工具函数
│   └── server.js          # 服务器入口
└── package.json           # 根目录配置
```

## API端点

- `GET /api/config` - 获取配置
- `POST /api/config` - 保存配置
- `POST /api/upload` - 上传mod文件
- `GET /api/lang/:sessionId/:modName` - 获取lang文件内容
- `POST /api/translate` - 执行翻译
- `GET /api/download/mod/:sessionId` - 下载打包mod
- `GET /api/download/lang/:sessionId/:modName` - 下载lang文件

## 注意事项

1. **文件大小限制**: 上传的mod文件最大为100MB
2. **翻译时间**: 翻译时间取决于条目数量和API响应速度
3. **API费用**: 使用LLM API会产生费用，请注意控制使用量
4. **文件格式**: 仅支持标准的Minecraft mod jar文件，且必须包含`assets/{mod_name}/lang/en_us.json`结构

## 开发

### 构建前端

```bash
cd frontend
npm run build
```

构建产物将输出到 `frontend/dist/` 目录

### 生产环境部署

1. 构建前端：`npm run build:frontend`
2. 启动后端：`npm run dev:backend`
3. 后端会自动服务前端构建产物

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！

