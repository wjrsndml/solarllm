from openai import OpenAI
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

client = OpenAI(
    api_key="sk-25171d1029b641938e890963e751bff4",
    base_url="https://api.deepseek.com"
)

def test_deepseek_reasoner():
    print("测试 DeepSeek Reasoner 模型流式传输...")
    messages = [{
                "role": "assistant",
                "content": "欢迎讨论太阳能电池相关的问题"
            },{"role": "user", "content": "9.11 和 9.8，哪个更大？"}]
    
    response = client.chat.completions.create(
        model="deepseek-reasoner",
        messages=messages,
        stream=True
    )

    reasoning_content = ""
    content = ""

    print("\n=== 推理过程 ===")
    for chunk in response:
        delta = chunk.choices[0].delta
        if hasattr(delta, 'reasoning_content') and delta.reasoning_content is not None:
            reasoning = delta.reasoning_content or ""
            reasoning_content += reasoning
            print(reasoning, end="", flush=True)
        elif delta.content:
            content += delta.content
            
    print("\n\n=== 最终回答 ===")
    print(content)
    
    print("\n=== 完整推理过程 ===")
    print(reasoning_content)

def test_deepseek_chat():
    print("\n测试 DeepSeek Chat 模型流式传输...")
    messages = [{"role": "user", "content": "9.11 和 9.8，哪个更大？"}]
    
    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=messages,
        stream=True
    )

    content = ""
    
    print("\n=== 回答 ===")
    for chunk in response:
        if chunk.choices[0].delta.content:
            content += chunk.choices[0].delta.content
            print(chunk.choices[0].delta.content, end="", flush=True)
    
    print("\n\n=== 完整回答 ===")
    print(content)

if __name__ == "__main__":
    test_deepseek_reasoner()
    test_deepseek_chat()

