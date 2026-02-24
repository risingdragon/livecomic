# Live Comic (活漫画)

**Live Comic** 是一个由 AI 驱动的交互式视觉小说/漫画生成器。玩家通过文字指令与世界互动，AI 实时生成剧情回复并绘制精美的场景插图。

## 🌟 核心特色

*   **无限剧情**：没有预设剧本，一切由你的指令和 AI 的想象力共同编织。
*   **实时插画**：每一次互动都会生成一张独一无二的场景插图，让故事栩栩如生。
*   **沉浸体验**：复古终端风格界面 + 宽屏视觉展示。
*   **多风格支持**：科幻、奇幻、武侠、赛博朋克... 你想玩什么风格，就玩什么风格。

## 🚀 技术栈

*   **前端**：React 18 + TypeScript + Vite + TailwindCSS
*   **状态管理**：Zustand (持久化存储)
*   **AI 模型**：
    *   **LLM**：阿里云百炼千问 (qwen-turbo) - 负责剧情生成和视觉描述
    *   **Image Gen**：阿里云百炼万相 (Wanx-v1) - 负责实时图像绘制

## 🛠️ 快速开始

1.  **克隆项目**
    ```bash
    git clone https://github.com/your-username/live-comic.git
    cd live-comic
    ```

2.  **安装依赖**
    ```bash
    pnpm install
    ```

3.  **配置环境变量**
    复制 `.env.example` 为 `.env`，并填入您的阿里云 DashScope API Key：
    ```bash
    cp .env.example .env
    # 编辑 .env 文件，填入 VITE_DASHSCOPE_API_KEY=sk-xxxxxxxx
    ```

4.  **启动开发服务器**
    ```bash
    pnpm dev
    ```

## 🎮 如何游玩

1.  启动后，在右侧终端输入指令。
2.  例如输入："醒来，环顾四周" 或 "Wake up and look around"。
3.  AI 会描述场景并生成一张插图。
4.  继续输入指令推进剧情。
5.  点击右侧终端上方的 **DEBUG_LOG** 标签页可查看 AI 交互的详细日志。

## 📄 License

MIT
