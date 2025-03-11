#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
生成文本嵌入向量的脚本
将txt目录下的文本文件处理为嵌入向量，并保存到embedding目录
"""

import os
import sys
from api.embed import TextEmbedding

def main():
    # 检查txt目录是否存在
    txt_dir = "txt"
    if not os.path.exists(txt_dir):
        print(f"错误: {txt_dir} 目录不存在，请创建该目录并放入文本文件")
        return 1
    
    # 检查txt目录中是否有文件
    files = [f for f in os.listdir(txt_dir) if f.endswith('.txt')]
    if not files:
        print(f"警告: {txt_dir} 目录中没有找到.txt文件")
        return 1
    
    print(f"找到 {len(files)} 个文本文件，开始处理...")
    
    # 创建embedding目录
    embedding_dir = "embedding"
    os.makedirs(embedding_dir, exist_ok=True)
    
    # 初始化TextEmbedding
    te = TextEmbedding()
    
    # 处理文本文件
    te.process_directory(txt_dir)
    
    # 保存嵌入向量
    te.save_with_file_info(embedding_dir)
    
    print(f"嵌入向量生成完成，已保存到 {embedding_dir} 目录")
    return 0

if __name__ == "__main__":
    sys.exit(main()) 