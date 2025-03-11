from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Optional, Tuple
from openai import OpenAI
import os
from dotenv import load_dotenv
from datetime import datetime
import uuid
import json
import asyncio
from starlette.background import BackgroundTask
from embed import TextEmbedding  # 导入嵌入模块

# 加载环境变量
load_dotenv()

app = FastAPI()

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有来源的请求，解决跨域问题
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

# 初始化文本嵌入
embedding_dir = os.getenv("EMBEDDING_DIR", "embedding")
text_embedding = None

# 在应用启动时加载嵌入
@app.on_event("startup")
async def startup_event():
    global text_embedding
    try:
        if os.path.exists(embedding_dir):
            print(f"正在从 {embedding_dir} 加载嵌入向量...")
            text_embedding = TextEmbedding.load_with_file_info(embedding_dir)
            print(f"嵌入向量加载完成，共 {len(text_embedding)} 个向量")
        else:
            print(f"嵌入向量目录 {embedding_dir} 不存在，跳过加载")
    except Exception as e:
        print(f"加载嵌入向量时出错: {str(e)}")
        import traceback
        traceback.print_exc()

class Message(BaseModel):
    role: str
    content: str
    reasoning_content: Optional[str] = None
    context_info: Optional[List[Dict[str, str]]] = None  # 添加上下文信息字段

class ChatRequest(BaseModel):
    messages: List[Message]
    conversation_id: str = None
    model: str = "deepseek-chat"  # 默认使用 deepseek-chat

class Conversation(BaseModel):
    id: str
    title: str
    created_at: str
    messages: List[Message]

# 搜索相关文本并返回上下文信息
def search_context(query: str, top_n: int = 5) -> List[Dict[str, str]]:
    global text_embedding
    context_info = []
    
    if text_embedding is None:
        print("嵌入向量未加载，无法搜索上下文")
        return context_info
    
    try:
        # 搜索相似文本
        similar_texts = text_embedding.search_similar_texts(query, top_n=top_n)
        
        # 构建上下文信息
        for text, similarity, file_name in similar_texts:
            context_info.append({
                "file_name": file_name or "未知文件",
                "content": text[:500] + "..." if len(text) > 500 else text,  # 限制内容长度
                "similarity": f"{similarity:.4f}"
            })
        
        print(f"为查询 '{query}' 找到 {len(context_info)} 个相关上下文")
    except Exception as e:
        print(f"搜索上下文时出错: {str(e)}")
        import traceback
        traceback.print_exc()
    
    return context_info

async def generate_stream_response(chat_request: ChatRequest, disconnect_event: asyncio.Event):
    try:
        print(f"开始处理请求，模型: {chat_request.model}")
        
        # 获取用户最新的消息
        user_message = chat_request.messages[-1]
        
        # 如果是用户消息，搜索相关上下文
        context_info = []
        if user_message.role == "user":
            context_info = search_context(user_message.content)
            
            # 将上下文信息添加到用户消息中
            user_message.context_info = context_info
            
            # 如果找到了上下文，构建系统提示
            if context_info:
                context_text = "\n\n相关参考资料:\n"
                for i, ctx in enumerate(context_info):
                    context_text += f"{i+1}. 文件: {ctx['file_name']}\n内容: {ctx['content']}\n\n"
                
                # 添加系统消息，提供上下文
                system_message = {
                    "role": "system", 
                    "content": f"以下是与用户问题相关的参考资料，请在回答时参考这些内容：\n{context_text}\n请基于以上参考资料回答用户的问题，如果参考资料中没有相关信息，请如实告知。"
                }
                
                # 准备发送给模型的消息
                messages_for_model = [system_message]
                for msg in chat_request.messages:
                    messages_for_model.append({"role": msg.role, "content": msg.content})
            else:
                # 如果没有找到上下文，直接使用原始消息
                messages_for_model = [{"role": msg.role, "content": msg.content} for msg in chat_request.messages]
        else:
            # 非用户消息，直接使用原始消息
            messages_for_model = [{"role": msg.role, "content": msg.content} for msg in chat_request.messages]
        
        # 发送请求到模型
        response = client.chat.completions.create(
            model=chat_request.model,
            messages=messages_for_model,
            stream=True
        )

        full_content = ""
        full_reasoning = ""
        
        # 首先发送上下文信息
        if context_info:
            context_data = json.dumps({'type': 'context', 'content': context_info})
            yield f"data: {context_data}\n\n"
        
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
            
            # 保存用户消息（包含上下文信息）
            user_message_dict = user_message.__dict__
            
            # 保存助手回复
            assistant_message = {
                "role": "assistant",
                "content": full_content,
                "reasoning_content": full_reasoning if chat_request.model == "deepseek-reasoner" else None
            }
            
            # 更新对话历史
            conversations[chat_request.conversation_id]["messages"].append(user_message_dict)
            conversations[chat_request.conversation_id]["messages"].append(assistant_message)
            
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