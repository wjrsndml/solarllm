from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
from openai import OpenAI
import os
from dotenv import load_dotenv
from datetime import datetime
import uuid

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

class Conversation(BaseModel):
    id: str
    title: str
    created_at: str
    messages: List[Message]

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
        
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[{"role": msg.role, "content": msg.content} for msg in chat_request.messages],
            stream=False
        )
        
        assistant_message = {
            "content": response.choices[0].message.content,
            "role": "assistant"
        }
        
        # 更新对话历史
        conversations[chat_request.conversation_id]["messages"].extend([
            chat_request.messages[-1].__dict__,  # 添加用户消息
            assistant_message  # 添加助手回复
        ])
        
        return assistant_message
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    return {"status": "ok"} 