# 太阳能电池AI对话前端

这是基于Next.js和Shadcn UI开发的太阳能电池AI对话助手前端应用。支持与后端API进行交互，实现流式输出和图片显示功能。

## 功能特点

- 支持流式响应，实时显示AI回复
- 支持显示和管理图片输出
- 支持多模型切换
- 响应式设计，适配移动端和桌面端
- 聊天历史管理
- 推理过程显示

## 技术栈

- Next.js 14 - React框架
- TypeScript - 类型安全
- Shadcn UI - 组件库
- Tailwind CSS - 样式系统
- EventSource API - 流式响应

## 开发设置

确保已安装Node.js (推荐v18或更高版本)

```bash
# 安装依赖
npm install

# 开发模式启动
npm run dev

# 构建生产版本
npm run build

# 启动生产版本
npm start
```

## 与后端集成

前端应用需要与后端API进行通信，确保后端服务已启动并可访问。API地址配置可在环境变量中设置：

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

如果没有设置，默认使用相对路径 `/api`。

## 使用方法

1. 在浏览器访问 `http://localhost:3000`
2. 使用左侧导航创建新对话或选择已有对话
3. 在输入框中输入问题并发送
4. 实时查看AI助手的回复，包括图片输出
