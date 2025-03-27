#!/usr/bin/env python3
import os
import base64
import io
import json
import glob
from typing import Dict, Any, List, Tuple, Optional
import matplotlib.pyplot as plt
from matplotlib.figure import Figure
import requests
import numpy as np
from dotenv import load_dotenv

from mcp.server.fastmcp import FastMCP, Context, Image
from starlette.applications import Starlette
from mcp.server.sse import SseServerTransport
from starlette.requests import Request
from starlette.routing import Mount, Route
from mcp.server import Server
import uvicorn

# 加载环境变量
load_dotenv()

# API设置
API_URL = "https://api.siliconflow.cn/v1/embeddings"
API_TOKEN = os.getenv("API_TOKEN", "")
MODEL_NAME = os.getenv("EMBEDDING_MODEL", "BAAI/bge-large-zh-v1.5")

class TextEmbedding:
    """文本嵌入类，使用外部API进行向量化"""
    
    def __init__(self):
        """初始化文本嵌入处理器"""
        self.documents = []  # 存储文档内容
        self.embeddings = []  # 存储嵌入向量
        self.file_info = []  # 存储文件信息
    
    def __len__(self):
        """返回嵌入向量数量"""
        return len(self.embeddings)
    
    def get_embedding(self, text: str) -> List[float]:
        """从API获取文本的嵌入向量"""
        payload = {
            "model": MODEL_NAME,
            "input": text,
            "encoding_format": "float"
        }
        headers = {
            "Authorization": f"Bearer {API_TOKEN}",
            "Content-Type": "application/json"
        }
        
        try:
            response = requests.post(API_URL, json=payload, headers=headers)
            response.raise_for_status()
            result = response.json()
            # 提取嵌入向量
            embedding = result.get("data", [{}])[0].get("embedding", [])
            return embedding
        except Exception as e:
            print(f"获取嵌入向量时出错: {str(e)}")
            return []
    
    def cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """计算两个向量的余弦相似度"""
        if not vec1 or not vec2:
            return 0.0
            
        vec1 = np.array(vec1)
        vec2 = np.array(vec2)
        
        dot_product = np.dot(vec1, vec2)
        norm_1 = np.linalg.norm(vec1)
        norm_2 = np.linalg.norm(vec2)
        
        if norm_1 == 0 or norm_2 == 0:
            return 0.0
            
        return dot_product / (norm_1 * norm_2)
    
    def load_with_file_info(self, directory: str) -> None:
        """从指定目录加载嵌入向量和文件信息"""
        # 加载文档内容
        with open(os.path.join(directory, "documents.json"), 'r', encoding='utf-8') as f:
            self.documents = json.load(f)
        
        # 加载嵌入向量
        with open(os.path.join(directory, "embeddings.json"), 'r') as f:
            self.embeddings = json.load(f)
        
        # 加载文件信息
        with open(os.path.join(directory, "file_info.json"), 'r', encoding='utf-8') as f:
            self.file_info = json.load(f)
    
    def search_similar_texts(self, query: str, top_n: int = 5, 
                            min_similarity: float = 0.5) -> List[Tuple[str, float, str]]:
        """搜索与查询最相似的文本"""
        if not self.embeddings:
            return []
            
        query_embedding = self.get_embedding(query)
        if not query_embedding:
            return []
            
        # 计算相似度分数
        similarities = [
            (doc, self.cosine_similarity(query_embedding, emb), file)
            for doc, emb, file in zip(self.documents, self.embeddings, self.file_info)
        ]
        
        # 按相似度降序排列并过滤低于阈值的结果
        results = sorted(
            [item for item in similarities if item[1] >= min_similarity],
            key=lambda x: x[1],
            reverse=True
        )
        
        # 返回前N个结果
        return results[:top_n]

def fig_to_image(fig: Figure) -> Image:
    """将matplotlib图像转换为MCP Image对象"""
    buf = io.BytesIO()
    fig.savefig(buf, format='png')
    buf.seek(0)
    img_data = buf.getvalue()
    return Image(data=img_data, format="png")

# 初始化FastMCP服务器
mcp = FastMCP("文本相似度查询服务")

# 初始化嵌入实例
embedding_dir = os.getenv("EMBEDDING_DIR", "embedding")
text_embedding = None

# 在服务器启动时加载嵌入
def load_text_embedding():
    global text_embedding
    try:
        if os.path.exists(embedding_dir):
            print(f"正在从 {embedding_dir} 加载嵌入向量...")
            text_embedding = TextEmbedding()
            text_embedding.load_with_file_info(embedding_dir)
            print(f"嵌入向量加载完成，共 {len(text_embedding)} 个向量")
        else:
            print(f"嵌入向量目录 {embedding_dir} 不存在，跳过加载")
            text_embedding = TextEmbedding()
    except Exception as e:
        print(f"加载嵌入向量时出错: {str(e)}")
        import traceback
        traceback.print_exc()
        text_embedding = TextEmbedding()

# 调用加载函数
load_text_embedding()

@mcp.tool()
async def search_embedded_text(
    query: str,              # 查询文本
    top_n: int = 5,          # 返回的相似文本数量
    min_similarity: float = 0.5,  # 最小相似度阈值
    ctx: Context = None
) -> Dict[str, Any]:
    """
    搜索与查询文本最相似的嵌入文本
    
    这个工具使用预训练的嵌入模型，根据语义相似度查找与查询文本最相关的文档。
    
    参数:
    - query: 要搜索的查询文本
    - top_n: 返回的最相似文本数量
    - min_similarity: 最小相似度阈值，低于此值的结果将被过滤
    
    返回:
    - 相似文本列表，包含文件名、内容和相似度
    """
    global text_embedding
    context_info = []
    
    if ctx:
        ctx.info(f"开始搜索与查询 '{query}' 相关的文本...")
    
    if text_embedding is None:
        if ctx:
            ctx.warning("嵌入向量未加载，无法搜索上下文")
        return {
            "text": {
                "error": "嵌入向量未加载，无法搜索上下文",
                "results": []
            }
        }
    
    try:
        # 搜索相似文本
        similar_texts = text_embedding.search_similar_texts(query, top_n=top_n, min_similarity=min_similarity)
        
        # 构建上下文信息
        for text, similarity, file_name in similar_texts:
            context_info.append({
                "file_name": file_name or "未知文件",
                "content": text[:500] + "..." if len(text) > 500 else text,  # 限制内容长度
                "similarity": f"{similarity:.4f}"
            })
        
        if ctx:
            ctx.info(f"为查询 '{query}' 找到 {len(context_info)} 个相关上下文")
        
        # 创建结果表格图
        if context_info and len(context_info) > 0:
            fig, ax = plt.subplots(figsize=(12, len(context_info) * 1.2 + 2))
            ax.axis('tight')
            ax.axis('off')
            
            table_data = []
            for item in context_info:
                # 截断内容以适应表格
                content_preview = item["content"]
                if len(content_preview) > 100:
                    content_preview = content_preview[:97] + "..."
                
                table_data.append([
                    item["file_name"],
                    content_preview,
                    item["similarity"]
                ])
            
            table = ax.table(
                cellText=table_data,
                colLabels=["文件名", "内容预览", "相似度"],
                loc='center',
                cellLoc='left'
            )
            
            # 调整表格样式
            table.auto_set_font_size(False)
            table.set_fontsize(9)
            table.scale(1, 1.5)
            
            # 设置列宽
            table.auto_set_column_width([0, 1, 2])
            
            plt.title(f"与查询 '{query}' 相关的文本")
            plt.tight_layout()
            
            # 转换为MCP Image对象
            results_image = fig_to_image(fig)
            plt.close(fig)
        else:
            results_image = None
    
    except Exception as e:
        if ctx:
            ctx.error(f"搜索上下文时出错: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "text": {
                "error": f"搜索上下文时出错: {str(e)}",
                "results": []
            }
        }
    
    return {
        "text": {
            "results": context_info
        },
        "image": [results_image] if results_image else []
    }

@mcp.tool()
async def compare_text_similarity(
    text1: str,              # 第一个文本
    text2: str,              # 第二个文本
    ctx: Context = None
) -> Dict[str, Any]:
    """
    比较两个文本的相似度
    
    这个工具使用嵌入模型计算两个文本之间的余弦相似度。
    
    参数:
    - text1: 第一个文本
    - text2: 第二个文本
    
    返回:
    - 两个文本之间的相似度分数
    """
    global text_embedding
    
    if ctx:
        ctx.info("开始计算文本相似度...")
    
    if text_embedding is None:
        text_embedding = TextEmbedding()
    
    try:
        # 获取两个文本的嵌入向量
        embedding1 = text_embedding.get_embedding(text1)
        embedding2 = text_embedding.get_embedding(text2)
        
        if not embedding1 or not embedding2:
            if ctx:
                ctx.error("获取嵌入向量失败")
            return {
                "text": {
                    "error": "获取嵌入向量失败",
                    "similarity": 0.0
                }
            }
        
        # 计算相似度
        similarity = text_embedding.cosine_similarity(embedding1, embedding2)
        
        if ctx:
            ctx.info(f"相似度计算完成，结果: {similarity:.4f}")
        
        # 创建可视化结果
        fig, ax = plt.subplots(figsize=(8, 4))
        ax.axis('tight')
        ax.axis('off')
        
        table_data = [
            ["文本1", text1[:100] + "..." if len(text1) > 100 else text1],
            ["文本2", text2[:100] + "..." if len(text2) > 100 else text2],
            ["相似度", f"{similarity:.4f}"]
        ]
        
        table = ax.table(
            cellText=table_data,
            loc='center',
            cellLoc='left'
        )
        
        # 调整表格样式
        table.auto_set_font_size(False)
        table.set_fontsize(9)
        table.scale(1, 1.5)
        
        # 设置列宽
        table.auto_set_column_width([0, 1])
        
        plt.title("文本相似度计算结果")
        plt.tight_layout()
        
        # 转换为MCP Image对象
        results_image = fig_to_image(fig)
        plt.close(fig)
        
        return {
            "text": {
                "similarity": similarity
            },
            "image": [results_image]
        }
    
    except Exception as e:
        error_msg = f"计算文本相似度时出错: {str(e)}"
        if ctx:
            ctx.error(error_msg)
        import traceback
        traceback.print_exc()
        
        return {
            "text": {
                "error": error_msg,
                "similarity": 0.0
            }
        }

def create_starlette_app(mcp_server: Server, *, debug: bool = False) -> Starlette:
    """创建一个Starlette应用，使用SSE为MCP服务器提供服务"""
    sse = SseServerTransport("/messages/")

    async def handle_sse(request: Request) -> None:
        async with sse.connect_sse(
                request.scope,
                request.receive,
                request._send,  # noqa: SLF001
        ) as (read_stream, write_stream):
            await mcp_server.run(
                read_stream,
                write_stream,
                mcp_server.create_initialization_options(),
            )

    return Starlette(
        debug=debug,
        routes=[
            Route("/sse", endpoint=handle_sse),
            Mount("/messages/", app=sse.handle_post_message),
        ],
    )

# 主入口点
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='文本相似度查询MCP服务器')
    parser.add_argument('--host', default='0.0.0.0', help='绑定的主机地址')
    parser.add_argument('--port', type=int, default=12347, help='监听的端口')
    parser.add_argument('--stdio', action='store_true', help='使用STDIO而不是SSE')
    args = parser.parse_args()
    
    if args.stdio:
        # 使用STDIO传输运行
        print("启动文本相似度查询MCP服务器，使用STDIO传输")
        mcp.run()
    else:
        # 使用SSE传输运行
        print(f"启动文本相似度查询MCP服务器，使用SSE传输，地址: http://{args.host}:{args.port}")
        mcp_server = mcp._mcp_server  # 访问底层服务器实例
        starlette_app = create_starlette_app(mcp_server, debug=True)
        uvicorn.run(starlette_app, host=args.host, port=args.port) 