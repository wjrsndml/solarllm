#!/usr/bin/env python3
import os
import json
import glob
import argparse
import traceback
from typing import List, Dict, Any, Tuple, Optional
import numpy as np
import requests
from dotenv import load_dotenv

# 文档处理库
import docx  # python-docx
import pdfplumber
import chardet

# 加载环境变量（API密钥等）
load_dotenv()

# API设置
API_URL = "https://api.siliconflow.cn/v1/embeddings"
API_TOKEN = os.getenv("API_TOKEN", "")
MODEL_NAME = os.getenv("EMBEDDING_MODEL", "BAAI/bge-large-zh-v1.5")

# 确保API_TOKEN已设置
if not API_TOKEN:
    print("警告: API_TOKEN未设置，请在.env文件中设置API_TOKEN变量")

class DocumentProcessor:
    """文档处理类，用于从不同格式的文档中提取文本"""
    
    @staticmethod
    def read_txt_file(file_path: str) -> str:
        """读取TXT文件内容"""
        try:
            # 首先尝试使用UTF-8编码
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except UnicodeDecodeError:
            # 如果失败，尝试检测编码
            with open(file_path, 'rb') as f:
                raw_data = f.read()
                detected = chardet.detect(raw_data)
                encoding = detected['encoding'] if detected['encoding'] else 'utf-8'
                
            # 使用检测到的编码重新读取
            try:
                with open(file_path, 'r', encoding=encoding) as f:
                    return f.read()
            except Exception as e:
                print(f"读取文件 {file_path} 失败: {str(e)}")
                return ""
    
    @staticmethod
    def read_docx_file(file_path: str) -> str:
        """读取DOCX文件内容"""
        try:
            doc = docx.Document(file_path)
            full_text = []
            for para in doc.paragraphs:
                full_text.append(para.text)
            return '\n'.join(full_text)
        except Exception as e:
            print(f"读取文件 {file_path} 失败: {str(e)}")
            return ""
    
    @staticmethod
    def read_pdf_file(file_path: str) -> str:
        """读取PDF文件内容"""
        try:
            text = []
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    text.append(page.extract_text() or "")
            return '\n'.join(text)
        except Exception as e:
            print(f"读取文件 {file_path} 失败: {str(e)}")
            return ""
    
    @classmethod
    def read_file(cls, file_path: str) -> Tuple[str, str]:
        """根据文件扩展名读取不同格式的文件"""
        file_extension = os.path.splitext(file_path)[1].lower()
        
        if file_extension == '.txt':
            return cls.read_txt_file(file_path), "txt"
        elif file_extension == '.docx':
            return cls.read_docx_file(file_path), "docx"
        elif file_extension == '.pdf':
            return cls.read_pdf_file(file_path), "pdf"
        else:
            print(f"不支持的文件格式: {file_extension}")
            return "", "unknown"

class EmbeddingGenerator:
    """嵌入向量生成类，使用API生成文本嵌入向量"""
    
    def __init__(self):
        """初始化嵌入向量生成器"""
        self.documents = []  # 存储文档内容
        self.embeddings = []  # 存储嵌入向量
        self.file_info = []  # 存储文件信息
    
    def __len__(self):
        """返回嵌入向量数量"""
        return len(self.embeddings)
    
    def get_embedding(self, text: str) -> List[float]:
        """从API获取文本的嵌入向量"""
        if not text or not text.strip():
            print("警告: 尝试嵌入空文本")
            return []
            
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
            traceback.print_exc()
            return []
    
    def add_document(self, content: str, file_info: Dict[str, str]) -> bool:
        """添加文档并生成嵌入向量"""
        if not content or not content.strip():
            print(f"跳过空文档: {file_info.get('file_name', '未知文件')}")
            return False
            
        embedding = self.get_embedding(content)
        if not embedding:
            print(f"为文档生成嵌入向量失败: {file_info.get('file_name', '未知文件')}")
            return False
            
        self.documents.append(content)
        self.embeddings.append(embedding)
        self.file_info.append(file_info)
        return True
    
    def save_embeddings(self, output_dir: str) -> bool:
        """保存嵌入向量和文件信息到指定目录"""
        if not self.embeddings:
            print("没有嵌入向量可保存")
            return False
            
        try:
            os.makedirs(output_dir, exist_ok=True)
            
            # 保存文档内容
            with open(os.path.join(output_dir, "documents.json"), 'w', encoding='utf-8') as f:
                json.dump(self.documents, f, ensure_ascii=False, indent=2)
            
            # 保存嵌入向量
            with open(os.path.join(output_dir, "embeddings.json"), 'w') as f:
                json.dump(self.embeddings, f)
            
            # 保存文件信息
            with open(os.path.join(output_dir, "file_info.json"), 'w', encoding='utf-8') as f:
                json.dump(self.file_info, f, ensure_ascii=False, indent=2)
                
            print(f"嵌入向量已保存到目录: {output_dir}")
            print(f"处理了 {len(self.embeddings)} 个文档")
            return True
        except Exception as e:
            print(f"保存嵌入向量时出错: {str(e)}")
            traceback.print_exc()
            return False

def process_directory(
    input_dir: str, 
    output_dir: str, 
    file_types: List[str] = ['txt', 'pdf', 'docx'],
    chunk_size: int = 4000,
    chunk_overlap: int = 200
) -> bool:
    """处理目录中的文档并生成嵌入向量"""
    # 初始化嵌入向量生成器
    embedding_generator = EmbeddingGenerator()
    
    # 构建文件模式列表
    file_patterns = [f"*.{file_type}" for file_type in file_types]
    
    # 获取所有匹配的文件
    all_files = []
    for pattern in file_patterns:
        all_files.extend(glob.glob(os.path.join(input_dir, pattern)))
        all_files.extend(glob.glob(os.path.join(input_dir, "**", pattern), recursive=True))
    
    if not all_files:
        print(f"在目录 {input_dir} 中未找到匹配的文件")
        return False
    
    print(f"找到 {len(all_files)} 个文件进行处理")
    processed_count = 0
    
    # 处理每个文件
    for file_path in all_files:
        try:
            print(f"处理文件: {os.path.basename(file_path)}")
            content, file_type = DocumentProcessor.read_file(file_path)
            
            if not content:
                print(f"文件内容为空，跳过: {file_path}")
                continue
            
            # 文件元数据
            file_info = {
                "file_name": os.path.basename(file_path),
                "file_path": os.path.abspath(file_path),
                "file_type": file_type
            }
            
            # 如果文本较长，分块处理
            if chunk_size > 0 and len(content) > chunk_size:
                chunks = split_text_into_chunks(content, chunk_size, chunk_overlap)
                for i, chunk in enumerate(chunks):
                    chunk_info = file_info.copy()
                    chunk_info["chunk_index"] = i
                    chunk_info["file_name"] = f"{file_info['file_name']}[{i}]"
                    
                    if embedding_generator.add_document(chunk, chunk_info):
                        processed_count += 1
            else:
                if embedding_generator.add_document(content, file_info):
                    processed_count += 1
            
        except Exception as e:
            print(f"处理文件 {file_path} 时出错: {str(e)}")
            traceback.print_exc()
    
    # 保存嵌入向量
    if processed_count > 0:
        print(f"成功处理了 {processed_count} 个文档/文档块")
        return embedding_generator.save_embeddings(output_dir)
    else:
        print("没有成功处理任何文档")
        return False

def split_text_into_chunks(text: str, chunk_size: int, overlap: int) -> List[str]:
    """将长文本分割成重叠的块"""
    if not text or chunk_size <= 0:
        return [text]
        
    chunks = []
    current_pos = 0
    text_length = len(text)
    
    while current_pos < text_length:
        # 确定当前块的结束位置
        end_pos = min(current_pos + chunk_size, text_length)
        
        # 如果不是最后一个块，尝试在段落或句子边界分割
        if end_pos < text_length:
            # 尝试在段落边界分割
            paragraph_end = text.rfind('\n\n', current_pos, end_pos)
            if paragraph_end > current_pos + chunk_size // 2:
                end_pos = paragraph_end + 2
            else:
                # 尝试在句子边界分割
                sentence_end = text.rfind('. ', current_pos, end_pos)
                if sentence_end > current_pos + chunk_size // 2:
                    end_pos = sentence_end + 2
        
        # 提取当前块
        chunk = text[current_pos:end_pos]
        chunks.append(chunk)
        
        # 更新位置，考虑重叠
        current_pos = end_pos - overlap if end_pos < text_length else text_length
    
    return chunks

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='将文档转换为嵌入向量')
    parser.add_argument('-i', '--input', required=True, help='输入目录，包含要处理的文档')
    parser.add_argument('-o', '--output', default='embedding', help='输出目录，用于保存嵌入向量')
    parser.add_argument('-t', '--types', default='txt,pdf,docx', help='要处理的文件类型，以逗号分隔')
    parser.add_argument('-c', '--chunk-size', type=int, default=4000, help='文本分块大小 (字符数)')
    parser.add_argument('-v', '--overlap', type=int, default=200, help='文本分块重叠大小 (字符数)')
    
    args = parser.parse_args()
    
    # 处理文件类型列表
    file_types = [t.strip() for t in args.types.split(',') if t.strip()]
    
    print(f"开始处理目录: {args.input}")
    print(f"文件类型: {', '.join(file_types)}")
    print(f"分块大小: {args.chunk_size}, 重叠大小: {args.overlap}")
    
    # 处理目录
    if process_directory(
        args.input, 
        args.output, 
        file_types, 
        args.chunk_size, 
        args.overlap
    ):
        print("文档处理成功完成")
    else:
        print("文档处理失败")
        exit(1) 