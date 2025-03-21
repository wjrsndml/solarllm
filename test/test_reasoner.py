import requests
import json
import os
from dotenv import load_dotenv
import time

# 加载环境变量
load_dotenv()

API_BASE_URL = "http://localhost:8000"

def test_deepseek_reasoner():
    """测试 DeepSeek Reasoner 模型的流式传输"""
    print("测试 DeepSeek Reasoner 模型流式传输...")
    
    # 创建新会话
    response = requests.post(f"{API_BASE_URL}/api/chat/create")
    if response.status_code != 200:
        print(f"创建会话失败: {response.text}")
        return
    
    conversation = response.json()
    conversation_id = conversation["id"]
    print(f"创建会话成功，ID: {conversation_id}")
    
    # 发送消息
    message = "9.11 和 9.8，哪个更大？"
    data = {
        "messages": [{"role": "user", "content": message}],
        "conversation_id": conversation_id,
        "model": "deepseek-reasoner"
    }
    
    print(f"发送消息: {message}")
    print(f"使用模型: deepseek-reasoner")
    
    response = requests.post(
        f"{API_BASE_URL}/api/chat/send", 
        json=data,
        stream=True,
        headers={"Accept": "text/event-stream"}
    )
    
    if response.status_code != 200:
        print(f"发送消息失败: {response.text}")
        return
    
    print("开始接收流式响应...")
    reasoning_content = ""
    content = ""
    
    for line in response.iter_lines():
        if not line:
            continue
            
        line = line.decode('utf-8')
        if line.startswith('data: '):
            try:
                data = json.loads(line[6:])
                if data["type"] == "reasoning":
                    reasoning_content += data["content"]
                    print(f"推理: {data['content']}", end="", flush=True)
                elif data["type"] == "content":
                    content += data["content"]
                    print(f"\n内容: {data['content']}", end="", flush=True)
            except Exception as e:
                print(f"解析数据失败: {e}, 原始数据: {line}")
    
    print("\n\n响应完成")
    print(f"完整推理内容: {reasoning_content}")
    print(f"完整回答内容: {content}")

def test_deepseek_chat():
    """测试 DeepSeek Chat 模型的流式传输"""
    print("\n测试 DeepSeek Chat 模型流式传输...")
    
    # 创建新会话
    response = requests.post(f"{API_BASE_URL}/api/chat/create")
    if response.status_code != 200:
        print(f"创建会话失败: {response.text}")
        return
    
    conversation = response.json()
    conversation_id = conversation["id"]
    print(f"创建会话成功，ID: {conversation_id}")
    
    # 发送消息
    message = "9.11 和 9.8，哪个更大？"
    data = {
        "messages": [{"role": "user", "content": message}],
        "conversation_id": conversation_id,
        "model": "deepseek-chat"
    }
    
    print(f"发送消息: {message}")
    print(f"使用模型: deepseek-chat")
    
    response = requests.post(
        f"{API_BASE_URL}/api/chat/send", 
        json=data,
        stream=True,
        headers={"Accept": "text/event-stream"}
    )
    
    if response.status_code != 200:
        print(f"发送消息失败: {response.text}")
        return
    
    print("开始接收流式响应...")
    content = ""
    
    for line in response.iter_lines():
        if not line:
            continue
            
        line = line.decode('utf-8')
        if line.startswith('data: '):
            try:
                data = json.loads(line[6:])
                if data["type"] == "content":
                    content += data["content"]
                    print(data["content"], end="", flush=True)
            except Exception as e:
                print(f"解析数据失败: {e}, 原始数据: {line}")
    
    print("\n\n响应完成")
    print(f"完整回答内容: {content}")

if __name__ == "__main__":
    # 确保服务器已启动
    try:
        response = requests.get(f"{API_BASE_URL}/api/health")
        if response.status_code != 200:
            print("服务器未启动或无法访问，请先启动服务器")
            exit(1)
    except Exception:
        print("服务器未启动或无法访问，请先启动服务器")
        exit(1)
        
    test_deepseek_reasoner()
    time.sleep(1)  # 等待一秒，避免请求过快
    test_deepseek_chat() 