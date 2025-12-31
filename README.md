<div align="center">

# ModLocalizer

<img src="logo.jpg" width="200" alt="Logo">

**一个基于Vue 3和Node.js的Minecraft模组自动汉化工具，使用LLM（大语言模型）进行翻译。**

[![GitHub release](https://img.shields.io/github/v/release/BakaCookie520/ModLocalizer)](https://github.com/BakaCookie520/ModLocalizer/releases)
[![Docker Image](https://img.shields.io/docker/pulls/bakacookie520/modlocalizer)](https://github.com/BakaCookie520/ModLocalizer/pkgs/container/modlocalizer)
[![License](https://img.shields.io/github/license/BakaCookie520/ModLocalizer)](LICENSE)

[快速开始](#安装步骤) • [功能特性](#功能特性) • [Docker部署](#docker部署) • [GitHub Actions](#cicd-github-actions)

</div>

## ✨ 功能特性

| 特性 | 描述 |
|------|------|
| 🚀 **自动提取** | 自动从mod文件中提取`en_us.json`语言文件 |
| 🤖 **智能翻译** | 使用LLM（支持OpenAI格式API）进行高质量翻译 |
| 📝 **手动编辑** | 支持对翻译结果进行手动编辑和优化 |
| 📦 **灵活下载** | 支持下载完整mod包或单独的lang文件 |
| 🎨 **现代化界面** | 基于Vue 3的直观易用的Web界面 |
| 🔧 **Docker支持** | 提供完整的Docker部署方案 |
| ⚡ **CI/CD集成** | 自动构建和发布到GitHub Releases |

## 技术栈

- **前端**: Vue 3 + Vite + Element Plus
- **后端**: Node.js + Express
- **文件处理**: adm-zip
- **LLM调用**: OpenAI SDK（支持OpenAI格式API）

## 安装步骤

### 1. 克隆项目

```bash
git clone https://github.com/BakaCookie520/ModLocalizer.git
cd ModLocalizer
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

## Docker部署

### 使用Docker Compose（推荐）

```bash
# 构建并启动服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 停止服务
docker-compose down

# 查看日志
docker-compose logs -f
```

### 使用Docker直接运行

```bash
# 构建镜像
docker build -t modlocalizer .

# 运行容器
docker run -d \
  --name modlocalizer \
  -p 3000:3000 \
  -v $(pwd)/uploads:/app/uploads \
  -v $(pwd)/config:/app/config \
  modlocalizer
```

### 环境变量配置

- `PORT`: 服务端口（默认：3000）
- `NODE_ENV`: 运行环境（默认：production）

### 数据持久化

Docker容器会自动创建以下目录用于数据持久化：
- `uploads/`: 上传的mod文件
- `config/`: 应用配置

## CI/CD (GitHub Actions)

项目配置了自动化的CI/CD流水线，支持：

### 触发条件
- **推送版本标签** (如 `v1.0.0`) - 自动构建Docker镜像并发布到GitHub Releases
- **手动触发** - 在GitHub Actions页面手动运行工作流（用于测试或特殊构建）

### 工作流程
1. **代码检查** - 检出代码
2. **Docker构建** - 使用Buildx构建多架构镜像
3. **镜像推送** - 推送到GitHub Container Registry
4. **镜像打包** - 将Docker镜像保存为tar.gz文件
5. **发布创建** (仅限标签推送) - 自动创建GitHub Release并附加镜像文件

### 使用方法

#### 手动触发构建
1. 访问项目的 `Actions` 标签页
2. 选择 `Docker Release` 工作流
3. 点击 `Run workflow` 按钮

#### 发布新版本
```bash
# 创建并推送版本标签
git tag v1.1.0
git push origin v1.1.0
```

#### 使用发布的镜像

##### 方式一：从Release下载镜像文件
1. 访问GitHub Releases页面
2. 下载 `modlocalizer-v1.1.0.tar.gz` 文件
3. 导入镜像：
```bash
gunzip modlocalizer-v1.1.0.tar.gz
docker load -i modlocalizer-v1.1.0.tar
```

##### 方式二：从GitHub Container Registry拉取
```bash
# 拉取最新发布的镜像
docker pull ghcr.io/bakacookie520/mod-localizer:latest

# 拉取特定版本
docker pull ghcr.io/bakacookie520/mod-localizer:v1.1.0
```

### 配置要求

确保在GitHub仓库中启用以下权限：
- **Actions** 权限
- **Packages** 权限（用于容器注册表）
- **Contents** 写入权限（用于发布）

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！

