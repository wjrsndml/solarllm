# 🔵 太阳能AI助手 - 现代化前端

一个基于Vue 3 + TypeScript的现代化太阳能电池智能预测与分析平台，用于替代原有的Gradio前端界面。

## ✨ 功能特色

### 🎯 核心功能
- **💬 AI智能对话** - 与太阳能电池专家AI交流，获取专业建议
- **⚡ 硅电池参数预测** - 实时预测硅电池JV曲线和性能参数
- **⏳ 钙钛矿电池老化预测** - 基于环境条件预测电池老化性能
- **🧪 钙钛矿电池参数预测** - 根据材料组分预测电池性能
- **🔷 钙钛矿带隙预测** - 计算钙钛矿材料的带隙值

### 🎨 设计特色
- **现代化UI设计** - 采用Element Plus组件库，界面美观大方
- **响应式布局** - 支持桌面和移动端，自适应不同屏幕尺寸
- **深浅色主题** - 支持明暗主题切换，保护用户视力
- **实时数据可视化** - 使用ECharts展示JV曲线等图表
- **防抖优化** - 参数输入防抖处理，提升用户体验

## 🛠️ 技术栈

### 前端框架
- **Vue 3** - 渐进式JavaScript框架
- **TypeScript** - 类型安全的JavaScript超集
- **Vite** - 快速的前端构建工具

### UI组件库
- **Element Plus** - 基于Vue 3的组件库
- **Tailwind CSS** - 实用优先的CSS框架
- **Vue ECharts** - Vue 3的ECharts组件

### 状态管理与路由
- **Pinia** - Vue 3的状态管理库
- **Vue Router** - Vue.js官方路由管理器

### 网络请求
- **Axios** - 基于Promise的HTTP客户端

## 📁 项目结构

```
web2/
├── public/                 # 静态资源
├── src/
│   ├── api/               # API接口
│   │   └── client.ts      # HTTP客户端配置
│   ├── components/        # 公共组件
│   │   └── Layout.vue     # 主布局组件
│   ├── stores/           # Pinia状态管理
│   │   └── theme.ts      # 主题状态
│   ├── types/            # TypeScript类型定义
│   │   └── index.ts      # 通用类型
│   ├── utils/            # 工具函数
│   │   └── debounce.ts   # 防抖函数
│   ├── views/            # 页面组件
│   │   ├── Chat.vue      # AI对话页面
│   │   ├── Solar.vue     # 硅电池预测页面
│   │   ├── Aging.vue     # 老化预测页面
│   │   ├── Perovskite.vue # 钙钛矿参数预测页面
│   │   └── Bandgap.vue   # 带隙预测页面
│   ├── router/           # 路由配置
│   │   └── index.ts      # 路由定义
│   ├── App.vue           # 根组件
│   ├── main.ts           # 应用入口
│   └── style.css         # 全局样式
├── index.html            # HTML模板
├── package.json          # 项目依赖
├── vite.config.ts        # Vite配置
├── tsconfig.json         # TypeScript配置
├── tailwind.config.js    # Tailwind配置
└── README.md            # 项目说明
```

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 7.0.0 或 yarn >= 1.22.0

### 安装依赖
```bash
cd web2
npm install
# 或
yarn install
```

### 开发模式
```bash
npm run dev
# 或
yarn dev
```

访问 http://localhost:5173 查看应用

### 构建生产版本
```bash
npm run build
# 或
yarn build
```

### 预览生产版本
```bash
npm run preview
# 或
yarn preview
```

## 🔧 配置说明

### API代理配置
在 `vite.config.ts` 中配置了API代理：
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, '')
  }
}
```

### 主题配置
支持明暗主题切换，主题状态保存在localStorage中：
- 浅色主题：默认主题，适合日间使用
- 深色主题：护眼主题，适合夜间使用

## 📊 页面功能详解

### 1. AI对话页面 (`/chat`)
- 实时对话界面，支持markdown渲染
- 模型选择功能
- 对话历史管理
- 打字动画效果

### 2. 硅电池参数预测 (`/solar`)
- 分类参数输入（物理尺寸、结与接触、掺杂浓度、界面缺陷）
- 实时JV曲线可视化
- 防抖预测优化
- 科学计数法参数显示

### 3. 钙钛矿电池老化预测 (`/aging`)
- 环境参数配置（温度、湿度、光照强度、测试时间）
- 老化性能预测结果
- 寿命评估和优化建议

### 4. 钙钛矿电池参数预测 (`/perovskite`)
- 材料组分配置
- 界面层参数设置
- 器件性能预测
- 结构优化建议

### 5. 钙钛矿带隙预测 (`/bandgap`)
- 材料组分选择（A位、B位、X位离子）
- 混合比例调节
- 带隙值计算
- 光学特性分析

## 🎯 与原Gradio版本的对比

| 特性 | Gradio版本 | Vue版本 |
|------|------------|---------|
| 界面美观度 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 响应式设计 | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| 交互体验 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 主题切换 | ❌ | ✅ |
| 数据可视化 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 代码维护性 | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| 扩展性 | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| 性能优化 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

## 🔮 后续优化计划

### 功能增强
- [ ] 添加更多图表类型支持
- [ ] 实现数据导出功能
- [ ] 添加参数预设模板
- [ ] 支持批量预测
- [ ] 添加预测历史记录

### 性能优化
- [ ] 实现虚拟滚动
- [ ] 添加缓存机制
- [ ] 优化图表渲染性能
- [ ] 实现懒加载

### 用户体验
- [ ] 添加快捷键支持
- [ ] 实现拖拽排序
- [ ] 添加引导教程
- [ ] 支持多语言

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- 提交 Issue
- 发送邮件
- 项目讨论区

---

**🔵 太阳能AI助手** - 让太阳能电池研究更智能、更高效！ 