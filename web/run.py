#!/usr/bin/env python
# 简易启动脚本，用于运行太阳能AI助手前端

import os
import sys
from dotenv import load_dotenv

# 加载环境变量（如果有）
load_dotenv()

def check_dependencies():
    """检查是否安装了所有依赖项"""
    try:
        import gradio
        import requests
        from PIL import Image
        return True
    except ImportError as e:
        print(f"缺少依赖项: {e}")
        print("请先运行: pip install -r requirements.txt")
        return False

def check_backend():
    """检查后端是否在运行"""
    import requests
    try:
        response = requests.get("http://localhost:8000/api/health", timeout=2)
        if response.status_code == 200:
            print("✅ 后端服务正在运行")
            return True
        else:
            print(f"⚠️ 后端服务返回状态码: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("⚠️ 无法连接到后端服务 (http://localhost:8000)")
        return False
    except Exception as e:
        print(f"⚠️ 检查后端时出错: {e}")
        return False

if __name__ == "__main__":
    # 检查依赖
    if not check_dependencies():
        sys.exit(1)
    
    # 检查后端服务
    backend_running = check_backend()
    if not backend_running:
        proceed = input("后端服务似乎未运行。是否仍要启动前端界面？(y/n): ")
        if proceed.lower() != 'y':
            print("已取消启动。请先确保后端服务运行。")
            sys.exit(1)
    
    # 启动前端应用
    print("正在启动太阳能AI助手前端...")
    try:
        from app import demo
        # 获取端口号（可通过环境变量覆盖）
        port = int(os.environ.get("PORT", 5173))
        demo.launch(server_name="0.0.0.0", server_port=port)
    except Exception as e:
        print(f"启动前端时出错: {e}")
        sys.exit(1) 