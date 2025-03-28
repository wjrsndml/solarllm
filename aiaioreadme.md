# aiaio (AI-AI-O) 使用指南

## 项目简介

aiaio 是一个轻量级、注重隐私的 Web UI，用于与 AI 模型进行交互。它支持通过 OpenAI 兼容的 API 连接本地和远程 LLM 部署。

![UI 截图](ui.png)

## 主要特性

- 🌓 支持暗/亮模式
- 💾 使用本地 SQLite 数据库存储对话
- 📁 支持文件上传和处理（图片、文档等）
- ⚙️ 通过 UI 配置模型参数
- 🔒 注重隐私（所有数据保存在本地）
- 📱 响应式设计，适配移动/桌面设备
- 🎨 代码块语法高亮
- 📋 一键复制代码块
- 🔄 实时对话更新
- 📝 自动对话摘要
- 🎯 可自定义系统提示词
- 🌐 支持 WebSocket 实时更新
- 📦 支持 Docker 部署
- 📦 支持多个 API 端点
- 📦 支持多个系统提示词

## 安装方式

### 使用 pip 安装

```bash
pip install aiaio
```

### 从源码安装

```bash
git clone https://github.com/abhishekkrthakur/aiaio.git
cd aiaio
pip install -e .
```

## 快速开始

1. 启动服务器：
```bash
aiaio app --host 127.0.0.1 --port 5000
```

2. 在浏览器中访问 `http://127.0.0.1:5000`

3. 在 UI 中配置您的 API 端点和模型设置

## 启动参数说明

- `--host`: 指定服务器主机地址，默认为 127.0.0.1
- `--port`: 指定服务器端口，默认为 10000
- `--workers`: 指定工作进程数量，默认为 1

## 支持的 API 端点

aiaio 可以与任何 OpenAI 兼容的 API 端点一起使用，包括：

- OpenAI API
- vLLM
- Text Generation Inference (TGI)
- Hugging Face Inference Endpoints
- llama.cpp server
- LocalAI
- 自定义 OpenAI 兼容 API

例如，您可以使用 vLLM 部署 llama 8b 模型：

```bash
vllm serve Meta-Llama-3.1-8B-Instruct.Q4_K_M.gguf --tokenizer meta-llama/Llama-3.1-8B-Instruct --max_model_len 125000
```

API 运行后，您可以通过 aiaio UI 访问它。

## Docker 使用方法

1. 构建 Docker 镜像：
```bash
docker build -t aiaio .
```

2. 运行容器：
```bash
docker run --network host -v /path/to/data:/data aiaio
```

`/data` 卷挂载是可选的，但建议使用它来持久化存储 SQLite 数据库和上传的文件。

## UI 配置

所有模型和 API 设置都可以通过 UI 进行配置：

### 模型参数
- **Temperature** (0-2)：控制响应的随机性。值越高，输出越有创意但越不聚焦
- **Max Tokens** (1-32k)：生成响应的最大长度
- **Top P** (0-1)：通过核采样控制多样性。值越低，输出越聚焦
- **Model Name**：要使用的模型名称/路径（取决于您的 API 端点）

### API 配置
- **Host**：您的 OpenAI 兼容 API 端点的 URL
- **API Key**：如果您的端点需要身份验证，则提供身份验证密钥

这些设置会存储在本地 SQLite 数据库中，并在会话之间保持不变。

## 项目结构

aiaio 的主要组件包括：

- `app/`: 包含 Web 应用程序代码、静态资源和模板
- `cli/`: 命令行界面代码
- `db.py`: 数据库操作和模型
- `prompts.py`: 系统提示词模板
- `logging.py`: 日志配置

## 技术栈

- 后端：FastAPI, uvicorn, SQLite
- 前端：原生 JavaScript, HTML, CSS
- 依赖：fastapi, uvicorn, loguru, jinja2, python-multipart, openai, websockets

## 系统要求

- Python 3.10+
- OpenAI 兼容的 API 端点（本地或远程）

## 高级使用

### 自定义系统提示词

每个对话都可以有自己的系统提示词，用于指导 AI 的行为。点击聊天窗口上方的"System Prompt"部分进行自定义。

### 对话管理

- 使用"+ New Chat"按钮创建新对话
- 在左侧边栏切换对话
- 使用垃圾桶图标删除对话
- 在侧边栏查看对话摘要

### 键盘快捷键

- `Ctrl/Cmd + Enter`: 发送消息
- `Esc`: 清除输入
- `Ctrl/Cmd + K`: 聚焦聊天输入框
- `Ctrl/Cmd + /`: 切换设置侧边栏

## 许可证

Apache License 2.0 

## 在 IDE 中运行和调试

如果您希望在 IDE 中运行和调试 aiaio 项目，可以按照以下步骤操作：

### 配置开发环境

1. 克隆项目并设置虚拟环境：
```bash
git clone https://github.com/abhishekkrthakur/aiaio.git
cd aiaio
python -m venv venv
source venv/bin/activate  # Windows 上使用 venv\Scripts\activate
pip install -e ".[dev]"
```

2. 在您的 IDE 中打开项目（如 VSCode、PyCharm 等）

### 常见 IDE 配置

#### VSCode

1. 安装 Python 扩展
2. 创建一个 `.vscode/launch.json` 文件，内容如下：
```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "aiaio app",
            "type": "python",
            "request": "launch",
            "module": "uvicorn",
            "args": [
                "aiaio.app.app:app",
                "--reload",
                "--host", "127.0.0.1",
                "--port", "5000"
            ],
            "jinja": true,
            "justMyCode": false
        }
    ]
}
```
3. 使用 VSCode 调试面板运行此配置

#### PyCharm

1. 转到 `Run > Edit Configurations`
2. 点击 `+` 按钮添加新配置
3. 选择 `Python`
4. 配置如下：
   - 脚本路径：指向您虚拟环境中的 uvicorn
   - 参数：`aiaio.app.app:app --reload --host 127.0.0.1 --port 5000`
   - 工作目录：项目根目录

### 直接使用模块

您也可以直接运行模块，方便调试：

```bash
# 在项目根目录执行
python -m uvicorn aiaio.app.app:app --reload --host 127.0.0.1 --port 5000
```

### 断点调试

1. 在 app.py 或其他源代码文件中设置断点
2. 使用 IDE 的调试功能启动应用
3. 在浏览器中访问应用并与之交互
4. 当执行到断点时，程序会暂停，您可以检查变量、堆栈等

### 修改代码后的热重载

由于使用了 `--reload` 参数，当您修改源代码后，uvicorn 会自动重新加载应用。这使得开发过程更加流畅。 

## 不使用 pip 安装而直接在 VSCode 中运行

如果您不想使用 pip 安装 aiaio，而是希望直接在 VSCode 中从源代码运行，可以按照以下步骤操作：

### 1. 准备项目

1. 克隆仓库到本地：
```bash
git clone https://github.com/abhishekkrthakur/aiaio.git
cd aiaio
```

2. 创建虚拟环境（推荐但非必须）：
```bash
python -m venv venv
source venv/bin/activate  # Windows 上使用 venv\Scripts\activate
```

### 2. 安装依赖

不使用 pip 安装整个包，而是直接安装必要的依赖：

```bash
pip install fastapi uvicorn loguru jinja2 python-multipart openai websockets
```

这些是 pyproject.toml 中列出的核心依赖。

### 3. 设置 PYTHONPATH

为了让 Python 能够找到项目模块，您需要将项目根目录添加到 PYTHONPATH。在 VSCode 中有两种方法：

#### 方法一：使用 launch.json

1. 创建或编辑 `.vscode/launch.json` 文件：
```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Run aiaio directly",
            "type": "python",
            "request": "launch",
            "module": "uvicorn",
            "args": [
                "src.aiaio.app.app:app",
                "--reload",
                "--host", "127.0.0.1",
                "--port", "5000"
            ],
            "env": {
                "PYTHONPATH": "${workspaceFolder}"
            },
            "jinja": true,
            "justMyCode": false
        }
    ]
}
```

注意路径变为 `src.aiaio.app.app:app`，并且设置了 `PYTHONPATH` 环境变量。

#### 方法二：使用 .env 文件

1. 在项目根目录创建 `.env` 文件：
```
PYTHONPATH=${workspaceFolder}
```

2. 安装 python-dotenv 支持：
```bash
pip install python-dotenv
```

3. 在 VSCode 中启用 .env 文件支持（Python 扩展设置中）

### 4. 直接运行入口点

您也可以直接运行 CLI 入口点文件：

1. 创建一个 `run.py` 文件在项目根目录：
```python
import sys
from src.aiaio.cli.aiaio import main

if __name__ == "__main__":
    sys.exit(main())
```

2. 在 VSCode 中设置运行此文件：
```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Run aiaio via entry point",
            "type": "python",
            "request": "launch",
            "program": "${workspaceFolder}/run.py",
            "args": ["app", "--host", "127.0.0.1", "--port", "5000"],
            "env": {
                "PYTHONPATH": "${workspaceFolder}"
            },
            "justMyCode": false
        }
    ]
}
```

### 5. 通过命令行运行

或者，您可以在终端中直接运行：

```bash
# 设置 PYTHONPATH
export PYTHONPATH=$PYTHONPATH:$(pwd)  # Linux/macOS
# 或
set PYTHONPATH=%PYTHONPATH%;%cd%  # Windows

# 直接运行 uvicorn
python -m uvicorn src.aiaio.app.app:app --reload --host 127.0.0.1 --port 5000
```

在 VSCode 的集成终端中执行上述命令也可以达到同样的效果。

### 注意事项

- 这种方法适合开发和调试，不建议用于生产环境
- 由于没有执行标准安装，可能会缺少一些资源文件，如果遇到相关错误，请检查文件路径
- 如果遇到模块导入错误，请检查 PYTHONPATH 是否正确设置 