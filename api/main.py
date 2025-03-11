from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Optional
from openai import OpenAI
import os
from dotenv import load_dotenv
from datetime import datetime
import uuid
import json
import asyncio
from starlette.background import BackgroundTask

# 加载环境变量
load_dotenv()

app = FastAPI()

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React 开发服务器地址
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 初始化 OpenAI 客户端
client = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com"
)

# 内存存储对话历史
conversations: Dict[str, dict] = {}

class Message(BaseModel):
    role: str
    content: str
    reasoning_content: Optional[str] = None

class ChatRequest(BaseModel):
    messages: List[Message]
    conversation_id: str = None
    model: str = "deepseek-chat"  # 默认使用 deepseek-chat

class Conversation(BaseModel):
    id: str
    title: str
    created_at: str
    messages: List[Message]

async def generate_stream_response(chat_request: ChatRequest, disconnect_event: asyncio.Event):
    try:
        print(f"开始处理请求，模型: {chat_request.model}")
        response = client.chat.completions.create(
            model=chat_request.model,
            messages=[{"role": msg.role, "content": msg.content} for msg in chat_request.messages],
            stream=True
        )

        full_content = ""
        full_reasoning = ""
        
        for chunk in response:
            # 检查客户端是否断开连接
            if disconnect_event.is_set():
                print("检测到客户端断开连接，停止生成")
                break
                
            if chat_request.model == "deepseek-reasoner":
                delta = chunk.choices[0].delta
                
                
                if hasattr(delta, 'reasoning_content') and delta.reasoning_content is not None:
                    reasoning = delta.reasoning_content or ""
                    full_reasoning += reasoning
                    if reasoning:
                        data = json.dumps({'type': 'reasoning', 'content': reasoning})
                        yield f"data: {data}\n\n"
                
                if hasattr(delta, 'content') and delta.content is not None:
                    content = delta.content or ""
                    full_content += content
                    if content:
                        data = json.dumps({'type': 'content', 'content': content})
                        yield f"data: {data}\n\n"
            else:
                content = chunk.choices[0].delta.content or ""
                full_content += content
                if content:
                    yield f"data: {json.dumps({'type': 'content', 'content': content})}\n\n"

        print(f"请求处理完成，模型: {chat_request.model}")
        print(f"完整推理内容: {full_reasoning}")
        print(f"完整回答内容: {full_content}")
        
        # 发送完成信号
        yield f"data: {json.dumps({'type': 'done', 'content': ''})}\n\n"

        # 保存完整的消息到对话历史
        if chat_request.conversation_id in conversations:
            # 如果是中断的消息，添加标记
            if disconnect_event.is_set():
                if full_content:
                    full_content += " [已中断]"
            
            conversations[chat_request.conversation_id]["messages"].extend([
                chat_request.messages[-1].__dict__,
                {
                    "role": "assistant",
                    "content": full_content,
                    "reasoning_content": full_reasoning if chat_request.model == "deepseek-reasoner" else None
                }
            ])
            
            # 如果是新对话的第一条消息，用它来命名对话
            if len(conversations[chat_request.conversation_id]["messages"]) == 3:  # 包含欢迎消息、用户消息和助手回复
                first_user_message = chat_request.messages[-1].content
                title = first_user_message[:20] + ("..." if len(first_user_message) > 20 else "")
                conversations[chat_request.conversation_id]["title"] = title

    except Exception as e:
        yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"
        print(f"生成响应时出错: {str(e)}")
        import traceback
        traceback.print_exc()

@app.post("/api/chat/create")
async def create_conversation():
    conversation_id = str(uuid.uuid4())
    conversations[conversation_id] = {
        "id": conversation_id,
        "title": "新对话",
        "created_at": datetime.now().isoformat(),
        "messages": [
            {
                "role": "system",
                "content": "欢迎讨论太阳能电池相关的问题"
            }
        ]
    }
    return conversations[conversation_id]

@app.get("/api/chat/history")
async def get_history():
    return list(conversations.values())

@app.post("/api/chat/send")
async def send_message(chat_request: ChatRequest, request: Request):
    try:
        # 如果没有会话ID，创建新会话
        if not chat_request.conversation_id or chat_request.conversation_id not in conversations:
            conversation = await create_conversation()
            chat_request.conversation_id = conversation["id"]
        
        print(f"处理聊天请求: 模型={chat_request.model}, 会话ID={chat_request.conversation_id}")
        print(f"消息内容: {chat_request.messages[-1].content}")
        
        # 创建一个事件来跟踪客户端断开连接
        disconnect_event = asyncio.Event()
        
        # 创建一个任务来监听客户端断开连接
        async def on_disconnect():
            print(f"客户端断开连接，会话ID={chat_request.conversation_id}")
            disconnect_event.set()
        
        return StreamingResponse(
            generate_stream_response(chat_request, disconnect_event),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            },
            background=BackgroundTask(on_disconnect)
        )
    except Exception as e:
        print(f"处理聊天请求时出错: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/models")
async def get_models():
    return {
        "models": [
            {
                "id": "deepseek-chat",
                "name": "DeepSeek Chat",
                "description": "标准对话模型"
            },
            {
                "id": "deepseek-reasoner",
                "name": "DeepSeek Reasoner",
                "description": "具有推理能力的对话模型"
            }
        ]
    }

@app.get("/api/health")
async def health_check():
    return {"status": "ok"} 

# 直接运行入口点，方便在 IDE 中调试
if __name__ == "__main__":
    import uvicorn
    print("正在启动调试服务器...")
    print("API 密钥:", os.getenv("DEEPSEEK_API_KEY")[:5] + "..." if os.getenv("DEEPSEEK_API_KEY") else "未设置")
    uvicorn.run(app, host="0.0.0.0", port=8000) 