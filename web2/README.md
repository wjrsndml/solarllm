# solarllm 前端重构版（web2）

本项目为 solarllm 的全新前端，基于 Next.js（React）、TypeScript、TailwindCSS 和 Shadcn/UI 组件库开发，界面美观，体验现代。

## 技术栈
- Next.js 14 + React 18
- TypeScript
- TailwindCSS
- Shadcn/UI
- Axios（与后端 API 通信）

## 目录结构
- `src/`：主要前端源码
- `app/`：Next.js 路由与页面
- `components/`：可复用 UI 组件

## 启动开发环境
```bash
cd web2
npm install # 如未安装依赖
npm run dev
```
本地默认端口为 http://localhost:3000

## 构建生产包
```bash
npm run build
npm start
```

## API 代理配置
如需本地开发时前端请求自动代理到 Python 后端（如 http://localhost:8000），可在 `next.config.js` 中配置 `rewrites`：
```js
// next.config.js
module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*', // 后端 API 地址
      },
    ]
  },
}
```

## 主要功能（待开发/迁移）
- 聊天对话（多轮、历史、模型切换）
- 太阳能参数预测
- 老化曲线预测
- 钙钛矿相关预测
- 图片处理与展示

---
如需自定义 UI 风格或有特殊需求，请联系开发者。
