#!/usr/bin/env python
# -*- coding: utf-8 -*-

import requests
import json
import base64
import os
import time
from datetime import datetime
import logging
from requests.exceptions import ChunkedEncodingError, ConnectionError

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# API配置
API_URL = "http://localhost:8000"  # 假设API运行在本地8000端口
TIMEOUT = 180  # 设置更长的超时时间，单位为秒

def test_batch_image_sending():
    """测试批量模拟的图片发送功能"""
    logger.info("开始测试批量模拟图片发送功能")
    
    # 创建一个新的会话
    session_id = f"test_batch_session_{int(time.time())}"
    
    # 构建请求头
    headers = {
        "Content-Type": "application/json",
        "Accept": "text/event-stream",
        "Connection": "keep-alive"  # 保持连接
    }
    
    # 测试消息 - 触发批量模拟工具调用
    message = {
        "messages": [{"role": "user", "content": "批量仿真太阳能电池，硅厚度100到200，间隔20"}],
        "model": "deepseek-chat",
        "conversation_id": session_id
    }
    
    logger.info(f"发送请求到API: {API_URL}/api/chat/send")
    logger.info(f"请求内容: {message}")
    
    # 发送请求
    try:
        response = requests.post(
            f"{API_URL}/api/chat/send",
            headers=headers,
            json=message,
            stream=True,  # 使用流式接收响应
            timeout=TIMEOUT  # 设置更长的超时时间
        )
        
        if response.status_code != 200:
            logger.error(f"请求失败，状态码: {response.status_code}")
            logger.error(f"响应内容: {response.text}")
            return False
        
        # 处理流式响应
        image_count = 0
        text_count = 0
        save_dir = "test_batch_images"
        os.makedirs(save_dir, exist_ok=True)
        
        logger.info("开始接收响应流")
        try:
            for line in response.iter_lines():
                if not line:
                    continue
                    
                # 移除SSE前缀"data: "并解析JSON
                if line.startswith(b"data: "):
                    data_str = line[6:].decode('utf-8')
                    try:
                        data = json.loads(data_str)
                        
                        # 检查是否接收到图像数据
                        if data.get("type") == "image":
                            image_count += 1
                            image_data = data.get("content", {})
                            tool_name = image_data.get("tool_name", "unknown")
                            image_index = image_data.get("image_index", 0)
                            image_format = image_data.get("format", "png")
                            
                            # 解码base64图像数据
                            img_base64 = image_data.get("image_data", "")
                            img_bytes = base64.b64decode(img_base64)
                            
                            # 保存图像
                            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                            filename = f"{save_dir}/{tool_name}_batch_image_{image_index}_{timestamp}.{image_format}"
                            
                            with open(filename, "wb") as f:
                                f.write(img_bytes)
                                
                            logger.info(f"成功接收并保存批量模拟图像: {filename}")
                        else:
                            text_count += 1
                            logger.info(f"接收到非图像数据: {data.get('type', 'unknown')}")
                            
                            # 检查是否为完成消息
                            if data.get("type") == "done":
                                logger.info("收到完成消息，流式传输完成")
                                break
                            
                    except json.JSONDecodeError:
                        logger.error(f"无法解析JSON数据: {data_str}")
                    except Exception as e:
                        logger.error(f"处理数据时出错: {str(e)}")
        except (ChunkedEncodingError, ConnectionError) as e:
            # 处理连接断开的情况
            logger.warning(f"连接中断: {str(e)}，但已接收到 {image_count} 张图像")
            # 如果已经接收到至少2张图像，批量测试仍然可以视为成功
            if image_count >= 2:
                logger.info("尽管连接中断，但已成功接收足够的图像")
        
        logger.info(f"测试完成，共接收到 {image_count} 张图像和 {text_count} 条文本消息")
        
        # 如果是批量模拟，应该至少接收到2张图像（趋势图和JV曲线图）
        return image_count >= 2
        
    except Exception as e:
        logger.error(f"请求过程中出错: {str(e)}")
        return False

def main():
    """主函数"""
    # 尝试运行测试，如果连接断开自动重试一次
    max_retries = 2
    for attempt in range(1, max_retries + 1):
        logger.info(f"尝试运行测试 {attempt}/{max_retries}")
        result = test_batch_image_sending()
        if result:
            logger.info("✅ 批量模拟图片发送测试成功")
            return
        elif attempt < max_retries:
            logger.warning(f"测试失败，等待5秒后重试...")
            time.sleep(5)
    
    logger.error("❌ 批量模拟图片发送测试失败（已尝试多次）")

if __name__ == "__main__":
    main() 