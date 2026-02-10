# H5 沙盒游戏 - 运行指南

## 环境要求

- Node.js 18+ 
- pnpm (推荐) 或 npm

## 安装依赖

```bash
pnpm install
```

## 开发环境运行

```bash
pnpm dev
```

应用将在 http://localhost:5173 启动

## 生产环境构建

```bash
pnpm build
```

构建产物位于 `dist/` 目录

## 配置 API Key

### 方式一：环境变量（推荐）

复制 `.env.example` 为 `.env`，并填写你的 API Key：

```bash
# DashScope (阿里云)
VITE_DASHSCOPE_API_KEY=your_dashscope_api_key_here

# Grok (xAI)
# VITE_GROK_API_KEY=xai-your_grok_api_key_here
```

### 方式二：界面配置

1. 点击右上角的设置按钮（齿轮图标）
2. 选择配置方式：
   - **预设平台**：输入 DashScope 或 Grok 的 API Key
   - **自定义 API**：输入聚合平台的 Base URL、API Key 和模型名称
3. 点击保存

## 支持的 API 平台

### 预设平台
- **DashScope** (阿里云)：Key 以 `sk-` 开头
- **Grok** (xAI)：Key 以 `xai-` 开头

### 自定义 API
支持任何兼容 OpenAI API 格式的平台，如：
- 各类 API 聚合平台
- 自建 OpenAI 兼容服务
- 企业私有部署

配置格式：
- Base URL: `https://api.example.com/v1`
- Chat Model: `gpt-3.5-turbo` 或 `gpt-4`
- Image Model: `dall-e-3` (可选)

## 部署到 Vercel

```bash
vercel --prod
```

或连接 GitHub 仓库自动部署。

## 注意事项

1. API Key 仅存储在浏览器本地，不会上传到服务器
2. 生产环境建议使用环境变量配置
3. 图片生成可能需要较长时间，请耐心等待
4. 如遇到 CORS 问题，请确保使用代理或正确的 Base URL
