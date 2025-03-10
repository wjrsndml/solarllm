# 太阳能电池智能助手

这是一个基于 DeepSeek 大语言模型的智能对话系统，专注于太阳能电池相关问题的交流和讨论。项目采用前后端分离架构，提供流畅的对话体验和直观的用户界面。

## 功能特点

- 💬 实时对话：支持流式输出，实现打字机效果
- 🤔 推理过程：使用 DeepSeek Reasoner 模型时可查看 AI 的推理过程
- 📝 对话历史：自动保存对话记录，支持多会话管理
- 🔄 智能命名：根据用户第一条消息自动命名对话
- 🎯 模型切换：支持在 DeepSeek Chat 和 DeepSeek Reasoner 两种模型之间切换
- 🎨 优雅界面：简洁直观的用户界面，支持暗色/亮色主题

## 技术栈

### 前端
- React 18
- TypeScript
- Ant Design
- Emotion (styled-components)
- Vite

### 后端
- FastAPI
- Python 3.8+
- DeepSeek API
- WebSocket (SSE)

## 快速开始

### 环境要求
- Node.js 16+
- Python 3.8+
- DeepSeek API 密钥

### 安装步骤

1. 克隆项目
```bash
git clone [项目地址]
cd solarllm
```

2. 安装后端依赖
```bash
cd api
pip install -r requirements.txt
```

3. 配置环境变量
```bash
# 在 api/.env 文件中配置
DEEPSEEK_API_KEY=your_api_key_here
```

4. 安装前端依赖
```bash
cd web
npm install
```

5. 启动服务

后端服务：
```bash
cd api
uvicorn main:app --reload
```

前端服务：
```bash
cd web
npm run dev
```

访问 http://localhost:5173 即可使用

## 项目结构

```
solarllm/
├── api/                # 后端目录
│   ├── main.py        # 主应用程序
│   ├── requirements.txt
│   └── .env
├── web/               # 前端目录
│   ├── src/
│   │   ├── components/
│   │   ├── api/
│   │   └── types/
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## 主要功能说明

### 对话功能
- 支持实时流式对话
- 自动保存对话历史
- 可查看 AI 推理过程（使用 Reasoner 模型时）
- 支持多轮对话上下文

### 会话管理
- 创建新会话
- 切换不同会话
- 智能会话命名
- 会话历史记录

### 模型选择
- DeepSeek Chat：标准对话模型
- DeepSeek Reasoner：具有推理能力的对话模型

## 开发计划

- [ ] 添加数据库支持，实现对话历史持久化
- [ ] 支持对话导出功能
- [ ] 添加用户认证系统
- [ ] 实现对话内容的搜索功能
- [ ] 支持更多的 AI 模型
- [ ] 添加太阳能电池专业知识库
- [ ] 优化移动端适配

## 贡献指南

欢迎提交 Issue 和 Pull Request。在提交 PR 之前，请确保：

1. 代码符合项目的代码规范
2. 添加必要的测试用例
3. 更新相关文档
4. 提交信息清晰明了

## 许可证

本项目采用 MIT 许可证 