from fastapi import FastAPI, HTTPException
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

class ChatRequest(BaseModel):
    messages: List[Message]
    conversation_id: str = None
    model: str = "deepseek-chat"  # 默认使用 deepseek-chat

class Conversation(BaseModel):
    id: str
    title: str
    created_at: str
    messages: List[Message]

async def generate_stream_response(chat_request: ChatRequest):
    try:
        response = client.chat.completions.create(
            model=chat_request.model,
            messages=[{"role": msg.role, "content": msg.content} for msg in chat_request.messages],
            stream=True
        )

        full_content = ""
        full_reasoning = ""
        
        for chunk in response:
            if chat_request.model == "deepseek-reasoner" and hasattr(chunk.choices[0].delta, 'reasoning_content'):
                reasoning = chunk.choices[0].delta.reasoning_content or ""
                full_reasoning += reasoning
                if reasoning:
                    yield f"data: {json.dumps({'type': 'reasoning', 'content': reasoning})}\n\n"
            
            content = chunk.choices[0].delta.content or ""
            full_content += content
            if content:
                yield f"data: {json.dumps({'type': 'content', 'content': content})}\n\n"

        # 保存完整的消息到对话历史
        if chat_request.conversation_id in conversations:
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

@app.post("/api/chat/create")
async def create_conversation():
    conversation_id = str(uuid.uuid4())
    conversations[conversation_id] = {
        "id": conversation_id,
        "title": "新对话",
        "created_at": datetime.now().isoformat(),
        "messages": [
            {
                "role": "assistant",
                "content": "欢迎讨论太阳能电池相关的问题"
            }
        ]
    }
    return conversations[conversation_id]

@app.get("/api/chat/history")
async def get_history():
    return list(conversations.values())

@app.post("/api/chat/send")
async def send_message(chat_request: ChatRequest):
    try:
        # 如果没有会话ID，创建新会话
        if not chat_request.conversation_id or chat_request.conversation_id not in conversations:
            conversation = await create_conversation()
            chat_request.conversation_id = conversation["id"]
        
        return StreamingResponse(
            generate_stream_response(chat_request),
            media_type="text/event-stream"
        )
    except Exception as e:
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