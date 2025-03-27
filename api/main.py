from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse, FileResponse
from pydantic import BaseModel
from typing import List, Dict, Optional, Tuple, Any
from openai import OpenAI
import os
from dotenv import load_dotenv
from datetime import datetime
import uuid
import json
import asyncio
from starlette.background import BackgroundTask
import base64
import io
from matplotlib.figure import Figure
import logging
from fastapi.staticfiles import StaticFiles
from mlutil import predict_solar_params
# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    filename='api.log'
)
logger = logging.getLogger(__name__)
# MCP客户端相关导入
from contextlib import AsyncExitStack
from mcp import ClientSession
from mcp.client.sse import sse_client

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

# 添加静态文件服务
@app.get("/api/files/{file_path:path}")
async def get_file(file_path: str):
    """提供对生成的图表和文件的访问"""
    try:
        # 设置安全限制，只允许访问指定目录
        allowed_prefixes = ["simulation_results/", "plot_results/"]
        is_allowed = any(file_path.startswith(prefix) for prefix in allowed_prefixes)
        
        if not is_allowed:
            raise HTTPException(status_code=403, detail="Access forbidden")
        
        # 构建文件的完整路径
        file_full_path = file_path
        
        # 检查文件是否存在
        if not os.path.exists(file_full_path):
            raise HTTPException(status_code=404, detail=f"File {file_path} not found")
        
        # 返回文件
        return FileResponse(
            file_full_path,
            media_type="image/png" if file_path.endswith(".png") else "application/octet-stream"
        )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        logger.info(f"获取文件时出错: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error serving file: {str(e)}")

# 初始化 OpenAI 客户端
client = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com"
)

# 内存存储对话历史
conversations: Dict[str, dict] = {}

# MCP服务器地址
MCP_SERVER_URL = os.getenv("MCP_SERVER_URL", "http://localhost:12346/sse")

# MCP客户端类
class MCPClient:
    def __init__(self):
        # 初始化会话和流对象
        self.session: Optional[ClientSession] = None
        self._streams_context = None
        self._session_context = None
        
    async def connect(self, server_url: str = MCP_SERVER_URL):
        """连接到MCP服务器"""
        try:
            # 使用SSE客户端连接到服务器
            self._streams_context = sse_client(url=server_url)
            streams = await self._streams_context.__aenter__()
            
            # 创建会话
            self._session_context = ClientSession(*streams)
            self.session = await self._session_context.__aenter__()
            
            # 初始化
            await self.session.initialize()
            
            # 列出可用工具，验证连接
            response = await self.session.list_tools()
            tool_names = [tool.name for tool in response.tools]
            logger.info(f"已连接到MCP服务器，可用工具: {tool_names}")
            return True
        except Exception as e:
            logger.info(f"连接MCP服务器失败: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
            
    async def call_tool(self, tool_name: str, arguments: Dict[str, Any]):
        """调用MCP工具"""
        if not self.session:
            raise ValueError("MCP会话未初始化，请先调用connect()")
        
        try:
            result = await self.session.call_tool(tool_name, arguments)
            return result
        except Exception as e:
            logger.info(f"调用MCP工具 {tool_name} 失败: {str(e)}")
            import traceback
            traceback.print_exc()
            raise

    async def list_tools(self):
        """获取可用工具列表"""
        if not self.session:
            raise ValueError("MCP会话未初始化，请先调用connect()")
        
        try:
            response = await self.session.list_tools()
            return response.tools
        except Exception as e:
            logger.info(f"获取工具列表失败: {str(e)}")
            import traceback
            traceback.print_exc()
            raise
            
    async def cleanup(self):
        """清理会话和连接"""
        try:
            if self._session_context:
                await self._session_context.__aexit__(None, None, None)
            if self._streams_context:
                await self._streams_context.__aexit__(None, None, None)
            logger.info("已断开MCP连接")
        except Exception as e:
            logger.info(f"清理MCP连接失败: {str(e)}")

# 全局MCP客户端实例
mcp_client = MCPClient()

# 在应用启动时连接MCP服务器
@app.on_event("startup")
async def startup_event():
    global mcp_client
    try:
        # 连接到MCP服务器
        connected = await mcp_client.connect()
        if connected:
            logger.info(f"成功连接到MCP服务器: {MCP_SERVER_URL}")
        else:
            logger.info(f"警告: 无法连接到MCP服务器: {MCP_SERVER_URL}，将使用本地功能")
    except Exception as e:
        logger.info(f"MCP连接初始化失败: {str(e)}")
        import traceback
        traceback.print_exc()

# 在应用关闭时断开MCP连接
@app.on_event("shutdown")
async def shutdown_event():
    global mcp_client
    await mcp_client.cleanup()

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

async def generate_stream_response(chat_request: ChatRequest, disconnect_event: asyncio.Event):
    try:
        logger.info(f"开始处理请求，模型: {chat_request.model}")
        
        # 准备OpenAI消息格式
        openai_messages = [{"role": msg.role, "content": msg.content} for msg in chat_request.messages]
        
        # 获取MCP工具列表
        available_tools = []
        if mcp_client.session:
            try:
                tools = await mcp_client.list_tools()
                available_tools = [{ 
                    "type": "function",
                    "function": {
                        "name": tool.name,
                        "description": tool.description,
                        "parameters": tool.inputSchema
                    }
                } for tool in tools]
                logger.info(f"为模型提供了 {len(available_tools)} 个可用工具")
            except Exception as e:
                logger.info(f"获取工具列表失败: {str(e)}")
                
        # 初始记录完整内容
        full_content = ""
        full_reasoning = ""
        
        # 处理上下文与工具调用的标志
        has_sent_context = False
        is_first_response = True
        tool_results = []
        
        # 用于累积工具调用信息的变量
        accumulated_tool_calls = {}  # 格式: {index: {'id': id, 'name': name, 'arguments': arguments}}
        
        while True:
            try:
                # 初始API调用或后续调用
                if is_first_response:
                    # 首次调用，可能使用工具
                    response = client.chat.completions.create(
                        model=chat_request.model,
                        messages=openai_messages,
                        tools=available_tools if available_tools else None,
                        stream=True
                    )
                else:
                    # 后续调用，无需再次提供工具列表
                    response = client.chat.completions.create(
                        model=chat_request.model,
                        messages=openai_messages,
                        stream=True
                    )
                
                # 收集完整内容
                current_content = ""
                has_tool_calls = False
                
                for chunk in response:
                    # 检查客户端是否断开连接
                    if disconnect_event.is_set():
                        logger.info("检测到客户端断开连接，停止生成")
                        break
                    
                    delta = chunk.choices[0].delta
                    
                    # 首次有内容时，发送上下文信息（如果有）
                    if not has_sent_context and (hasattr(delta, 'content') and delta.content or 
                                               hasattr(delta, 'tool_calls') and delta.tool_calls):
                        has_sent_context = True
                        if tool_results:
                            # 如果有工具调用结果，将其作为上下文发送
                            context_info = [
                                {"file_name": result["call"], "content": result["summary"]} 
                                for result in tool_results
                            ]
                            if context_info:
                                context_data = json.dumps({'type': 'context', 'content': context_info})
                                yield f"data: {context_data}\n\n"
                    
                    # 处理工具调用请求 - 累积工具调用信息
                    if hasattr(delta, 'tool_calls') and delta.tool_calls:
                        has_tool_calls = True
                        for tool_call in delta.tool_calls:
                            # 获取工具调用索引
                            idx = tool_call.index
                            
                            # 初始化累积结构（如果不存在）
                            if idx not in accumulated_tool_calls:
                                accumulated_tool_calls[idx] = {
                                    'id': None,
                                    'name': None,
                                    'arguments': ''
                                }
                            
                            # 累积ID
                            if hasattr(tool_call, 'id') and tool_call.id:
                                accumulated_tool_calls[idx]['id'] = tool_call.id
                            
                            # 累积函数名和参数
                            if hasattr(tool_call, 'function'):
                                if hasattr(tool_call.function, 'name') and tool_call.function.name:
                                    accumulated_tool_calls[idx]['name'] = tool_call.function.name
                                
                                if hasattr(tool_call.function, 'arguments') and tool_call.function.arguments:
                                    accumulated_tool_calls[idx]['arguments'] += tool_call.function.arguments
                    
                    # 处理reasoning内容（对于deepseek-reasoner模型）
                    if chat_request.model == "deepseek-reasoner" and hasattr(delta, 'reasoning_content') and delta.reasoning_content:
                        reasoning = delta.reasoning_content
                        full_reasoning += reasoning
                        yield f"data: {json.dumps({'type': 'reasoning', 'content': reasoning})}\n\n"
                    
                    # 处理常规内容
                    if hasattr(delta, 'content') and delta.content:
                        content = delta.content
                        current_content += content
                        full_content += content
                        yield f"data: {json.dumps({'type': 'content', 'content': content})}\n\n"
                
                # 如果有工具调用，处理累积的工具调用信息
                if has_tool_calls and accumulated_tool_calls:
                    # 收集当前聊天信息
                    assistant_message = {
                        "role": "assistant",
                        "content": current_content if current_content else None
                    }
                    
                    # 添加工具调用
                    tool_calls = []
                    
                    # 将当前助手消息添加到历史
                    openai_messages.append(assistant_message)
                    
                    # 处理所有累积的工具调用
                    for idx, tool_info in accumulated_tool_calls.items():
                        # 验证是否有足够的信息
                        if not tool_info['id'] or not tool_info['name']:
                            logger.info(f"工具调用信息不完整，跳过: {tool_info}")
                            continue
                            
                        tool_name = tool_info['name']
                        arguments_str = tool_info['arguments']
                        
                        try:
                            arguments = json.loads(arguments_str)
                        except json.JSONDecodeError:
                            logger.info(f"解析工具参数失败，格式错误: {arguments_str}")
                            arguments = {}
                        
                        logger.info(f"模型请求调用工具: {tool_name}，参数: {arguments}")
                        
                        # 添加工具调用信息
                        tool_calls.append({
                            "id": tool_info['id'],
                            "type": "function",
                            "function": {
                                "name": tool_name,
                                "arguments": arguments_str
                            }
                        })
                        
                        # 执行工具调用
                        if mcp_client.session:
                            try:
                                result = await mcp_client.call_tool(tool_name, arguments)
                                logger.info(f"工具 {tool_name} 返回结果: {result}")
                                # 处理结果内容
                                result_content = ""
                                
                                # 处理不同类型的工具返回结果
                                if isinstance(result.content, list) and all(hasattr(item, 'text') for item in result.content):
                                    # 如果是TextContent对象列表，提取所有text属性并合并
                                    result_content = " ".join(item.text for item in result.content)
                                elif hasattr(result.content, 'text'):
                                    # 单个TextContent对象
                                    text_content = result.content.text
                                    
                                    # 将字典或列表转换为字符串
                                    if isinstance(text_content, dict) or isinstance(text_content, list):
                                        result_content = json.dumps(text_content, ensure_ascii=False)
                                    else:
                                        result_content = str(text_content)
                                else:
                                    # 其他情况尝试JSON序列化
                                    result_content = json.dumps(result.content) if not isinstance(result.content, str) else str(result.content)
                                
                                # 检查结果是否包含图像数据
                                try:
                                    # 解析工具返回的文本内容
                                    if isinstance(result.content, list) and len(result.content) > 0:
                                        content_item = result.content[0]
                                        if hasattr(content_item, 'text') and content_item.text:
                                            # 尝试解析文本内容中的JSON字符串
                                            import ast
                                            try:
                                                logger.info(f"解析工具返回内容: {content_item.text}...")
                                                try:
                                                    content_dict = json.loads(content_item.text)
                                                except json.JSONDecodeError:
                                                    # 如果JSON解析失败，尝试使用ast.literal_eval
                                                    content_dict = ast.literal_eval(content_item.text)
                                                
                                                # 检测是否包含file_path属性
                                                has_file_paths = False
                                                file_paths = []
                                                
                                                # 确定文件路径列表
                                                if 'file_path' in content_dict and content_dict['file_path']:
                                                    has_file_paths = True
                                                    if isinstance(content_dict['file_path'], str):
                                                        # 单个文件路径
                                                        file_paths = [content_dict['file_path']]
                                                    elif isinstance(content_dict['file_path'], list):
                                                        # 文件路径列表
                                                        file_paths = content_dict['file_path']
                                                # 检查文本字段中是否包含file_path
                                                elif 'text' in content_dict and isinstance(content_dict['text'], dict):
                                                    if 'file_path' in content_dict['text'] and content_dict['text']['file_path']:
                                                        has_file_paths = True
                                                        if isinstance(content_dict['text']['file_path'], str):
                                                            file_paths = [content_dict['text']['file_path']]
                                                        elif isinstance(content_dict['text']['file_path'], list):
                                                            file_paths = content_dict['text']['file_path']
                                                            
                                                if has_file_paths and file_paths:
                                                    # 添加图像信息到结果
                                                    result_content += f"\n(结果包含{len(file_paths)}个图像文件)"
                                                    
                                                    # 发送每个图像文件
                                                    for i, file_path in enumerate(file_paths):
                                                        try:
                                                            # 确认文件存在
                                                            if os.path.exists(file_path):
                                                                # 读取图像文件
                                                                with open(file_path, 'rb') as img_file:
                                                                    img_data = img_file.read()
                                                                
                                                                # 确定图像格式（从文件扩展名）
                                                                img_format = os.path.splitext(file_path)[1].lstrip('.')
                                                                if not img_format:
                                                                    img_format = 'png'  # 默认格式
                                                                
                                                                # 转换为base64编码
                                                                img_base64 = base64.b64encode(img_data).decode('utf-8')
                                                                
                                                                # 发送图像数据
                                                                image_data = {
                                                                    'type': 'image', 
                                                                    'content': {
                                                                        'tool_name': tool_name,
                                                                        'image_data': img_base64,
                                                                        'image_index': i,
                                                                        'format': img_format,
                                                                        'source_path': file_path
                                                                    }
                                                                }
                                                                yield f"data: {json.dumps(image_data)}\n\n"
                                                                logger.info(f"发送工具 {tool_name} 的图像数据 #{i}，文件路径: {file_path}")
                                                            else:
                                                                logger.info(f"图像文件不存在: {file_path}")
                                                        except Exception as e:
                                                            logger.info(f"处理图像文件时出错: {str(e)}")
                                                
                                                # 如果同时还有image字段，也处理它
                                                has_images = 'image' in content_dict and isinstance(content_dict['image'], list) and len(content_dict['image']) > 0
                                                if has_images:
                                                    # 添加图像信息到结果（如果还没有添加）
                                                    if not has_file_paths:
                                                        result_content += "\n(结果包含图像数据)"
                                                    
                                                    # 单独处理图像数据对象，发送给前端
                                                    start_index = len(file_paths)  # 从file_paths之后的索引开始
                                                    for i, img in enumerate(content_dict['image']):
                                                        try:
                                                            # 获取图像数据
                                                            if hasattr(img, 'data') and img.data:
                                                                # 转换为base64编码
                                                                img_base64 = base64.b64encode(img.data).decode('utf-8')
                                                                
                                                                # 确定图像格式
                                                                img_format = 'png'
                                                                if hasattr(img, 'format') and img.format:
                                                                    img_format = img.format
                                                                
                                                                # 发送图像数据，但不将其添加到消息历史中
                                                                image_data = {
                                                                    'type': 'image', 
                                                                    'content': {
                                                                        'tool_name': tool_name,
                                                                        'image_data': img_base64,
                                                                        'image_index': i + start_index,
                                                                        'format': img_format
                                                                    }
                                                                }
                                                                yield f"data: {json.dumps(image_data)}\n\n"
                                                                logger.info(f"发送工具 {tool_name} 的图像对象数据 #{i + start_index}")
                                                        except Exception as e:
                                                            logger.info(f"处理图像对象数据时出错: {str(e)}")
                                            except Exception as e:
                                                logger.info(f"解析工具返回内容时出错: {str(e)}")
                                except Exception as e:
                                    logger.info(f"处理工具返回结果时出错: {str(e)}")
                                
                                # 将工具调用结果添加到历史记录中
                                openai_messages.append({
                                    "role": "tool",
                                    "tool_call_id": tool_info['id'],
                                    "content": result_content
                                })
                                
                                # 记录工具结果，用于上下文显示
                                tool_results.append({
                                    "call": tool_name,
                                    "summary": f"工具 {tool_name} 返回结果: {result_content[:200]}..." if len(result_content) > 200 else result_content
                                })
                                
                                logger.info(f"工具 {tool_name} 调用成功")
                                
                            except Exception as e:
                                error_msg = f"工具 {tool_name} 调用失败: {str(e)}"
                                logger.info(error_msg)
                                
                                # 添加错误信息
                                openai_messages.append({
                                    "role": "tool",
                                    "tool_call_id": tool_info['id'],
                                    "content": error_msg
                                })
                                
                                # 记录错误结果
                                tool_results.append({
                                    "call": tool_name,
                                    "summary": error_msg
                                })
                    
                    # 添加工具调用信息到助手消息
                    if tool_calls:
                        assistant_message["tool_calls"] = tool_calls
                    
                    # 清空累积的工具调用信息，准备下一轮
                    accumulated_tool_calls.clear()
                    
                    # 开始下一轮，获取助手根据工具结果的回复
                    is_first_response = False
                    continue
                
                # 如果没有工具调用，或者已经完成了工具调用和响应
                break
                
            except Exception as e:
                error_msg = f"处理请求时出错: {str(e)}"
                logger.info(error_msg)
                yield f"data: {json.dumps({'type': 'error', 'content': error_msg})}\n\n"
                break
            
        logger.info(f"请求处理完成，模型: {chat_request.model}")
        if full_reasoning:
            logger.info(f"完整推理内容长度: {len(full_reasoning)} 字符")
        logger.info(f"完整回答内容长度: {len(full_content)} 字符")
        
        # 发送完成信号
        yield f"data: {json.dumps({'type': 'done', 'content': ''})}\n\n"

        # 保存完整的消息到对话历史
        if chat_request.conversation_id in conversations:
            # 如果是中断的消息，添加标记
            if disconnect_event.is_set():
                if full_content:
                    full_content += " [已中断]"
            
            # 保存用户消息
            user_message = chat_request.messages[-1].__dict__
            
            # 保存助手回复
            assistant_message = {
                "role": "assistant",
                "content": full_content,
                "reasoning_content": full_reasoning if chat_request.model == "deepseek-reasoner" else None
            }
            
            # 更新对话历史
            conversations[chat_request.conversation_id]["messages"].append(user_message)
            conversations[chat_request.conversation_id]["messages"].append(assistant_message)
            
            # 如果是新对话的第一条消息，用它来命名对话
            if len(conversations[chat_request.conversation_id]["messages"]) == 3:  # 包含欢迎消息、用户消息和助手回复
                first_user_message = chat_request.messages[-1].content
                title = first_user_message[:20] + ("..." if len(first_user_message) > 20 else "")
                conversations[chat_request.conversation_id]["title"] = title

    except Exception as e:
        error_msg = f"生成响应时出错: {str(e)}"
        logger.info(error_msg)
        import traceback
        traceback.print_exc()
        yield f"data: {json.dumps({'type': 'error', 'content': error_msg})}\n\n"

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
        
        logger.info(f"处理聊天请求: 模型={chat_request.model}, 会话ID={chat_request.conversation_id}")
        logger.info(f"消息内容: {chat_request.messages[-1].content}")
        
        # 创建一个事件来跟踪客户端断开连接
        disconnect_event = asyncio.Event()
        
        # 创建一个任务来监听客户端断开连接
        async def on_disconnect():
            logger.info(f"客户端断开连接，会话ID={chat_request.conversation_id}")
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
        logger.info(f"处理聊天请求时出错: {str(e)}")
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

# 太阳能电池参数模型
class SolarParams(BaseModel):
    Si_thk: float
    t_SiO2: float
    t_polySi_rear_P: float
    front_junc: float
    rear_junc: float
    resist_rear: float
    Nd_top: float
    Nd_rear: float
    Nt_polySi_top: float
    Nt_polySi_rear: float
    Dit_Si_SiOx: float
    Dit_SiOx_Poly: float
    Dit_top: float

# 获取默认参数
@app.get("/api/solar/default-params")
async def get_default_params():
    default_params = {
        'Si_thk': 180,
        't_SiO2': 1.4,
        't_polySi_rear_P': 100,
        'front_junc': 0.5,
        'rear_junc': 0.5,
        'resist_rear': 100,
        'Nd_top': 1e20,
        'Nd_rear': 1e20,
        'Nt_polySi_top': 1e20,
        'Nt_polySi_rear': 1e20,
        'Dit_Si_SiOx': 1e10,
        'Dit_SiOx_Poly': 1e10,
        'Dit_top': 1e10
    }
    return default_params

# 太阳能电池参数预测，通过主流程中的工具调用已覆盖，此处保留API兼容性
@app.post("/api/solar/predict")
async def predict_params(params: SolarParams):
    try:
        
        # 将参数转为字典
        input_params = {
            'Si_thk': params.Si_thk,
            't_SiO2': params.t_SiO2, 
            't_polySi_rear_P': params.t_polySi_rear_P,
            'front_junc': params.front_junc,
            'rear_junc': params.rear_junc,
            'resist_rear': params.resist_rear,
            'Nd_top': params.Nd_top,
            'Nd_rear': params.Nd_rear,
            'Nt_polySi_top': params.Nt_polySi_top,
            'Nt_polySi_rear': params.Nt_polySi_rear,
            'Dit Si-SiOx': params.Dit_Si_SiOx,
            'Dit SiOx-Poly': params.Dit_SiOx_Poly,
            'Dit top': params.Dit_top
        }
        
        # 预测参数
        predictions, fig = predict_solar_params(input_params)
        
        # 将图像转换为base64编码
        buf = io.BytesIO()
        fig.savefig(buf, format='png')
        buf.seek(0)
        img_base64 = base64.b64encode(buf.read()).decode('utf-8')
        
        # 返回预测结果和图像
        return {
            "predictions": predictions,
            "jv_curve": img_base64
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 直接运行入口点
if __name__ == "__main__":
    import uvicorn
    logger.info("正在启动服务器...")
    logger.info("API 密钥:", os.getenv("DEEPSEEK_API_KEY")[:5] + "..." if os.getenv("DEEPSEEK_API_KEY") else "未设置")
    logger.info(f"MCP服务器地址: {MCP_SERVER_URL}")
    uvicorn.run(app, host="0.0.0.0", port=8000)
