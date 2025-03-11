# SolarLLM - 太阳能领域智能助手

SolarLLM是一个基于大语言模型的太阳能领域智能助手，可以回答太阳能相关的问题，并通过文本嵌入技术提供更精准的回答。

## 功能特点

- 基于DeepSeek大语言模型的智能问答
- 支持文本嵌入检索，提供更精准的回答
- 显示匹配到的相关文档和内容
- 支持多种模型切换
- 支持对话历史记录保存

## 系统架构

- 前端：React + TypeScript + Ant Design
- 后端：FastAPI + Python
- 嵌入模型：BAAI/bge-base-en-v1.5

## 安装与使用

### 环境要求

- Python 3.8+
- Node.js 16+
- npm 或 yarn

### 后端设置

1. 安装依赖

```bash
cd api
pip install -r requirements.txt
```

2. 配置环境变量

复制`.env.example`文件为`.env`，并填写相应的配置：

```bash
cp .env.example .env
```

编辑`.env`文件，填写DeepSeek API密钥和嵌入向量目录：

```
DEEPSEEK_API_KEY=your_api_key_here
EMBEDDING_DIR=embedding
```

3. 准备嵌入向量

将文本文件放入`txt`目录，然后运行以下命令生成嵌入向量：

```bash
python -c "from api.embed import TextEmbedding; te = TextEmbedding(); te.process_directory('txt'); te.save_with_file_info('embedding')"
```

4. 启动后端服务

```bash
cd api
nohup uvicorn main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 & echo $! > backend.pid
```

### 前端设置

1. 安装依赖

```bash
cd web
npm install
```

2. 启动开发服务器

```bash
nohup npm run dev -- --host > frontend.log 2>&1 & echo $! > frontend.pid
```

3. 构建生产版本

```bash
npm run build
```

## 部署说明

### 服务器部署

1. 构建前端

```bash
cd web
npm run build
```

2. 配置Nginx

```nginx
server {
    listen 80;
    server_name your_domain.com;

    location / {
        root /path/to/web/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

3. 启动后端服务

```bash
cd api
nohup uvicorn main:app --host 0.0.0.0 --port 8000 &
```

## 使用说明

1. 打开浏览器访问前端页面
2. 在输入框中输入问题
3. 系统会自动检索相关文档，并在回答中参考这些内容
4. 相关文档会显示在回答上方，包括文件名和匹配内容

## 许可证

MIT 

# 关闭前端
kill $(cat frontend.pid) && rm frontend.pid

# 关闭后端
kill $(cat backend.pid) && rm backend.pid 