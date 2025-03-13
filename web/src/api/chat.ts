import { Message, ChatResponse, Conversation, Model, StreamChunk } from '../types/chat';
import logger from '../utils/logger';

// 动态获取API基础URL，解决跨域问题
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:8000' 
  : `${window.location.protocol}//${window.location.hostname}:8000`;

// 记录API基础URL
logger.info('API基础URL', { API_BASE_URL });

/**
 * 发送消息到后端API
 */
export async function sendMessage(
  messages: Message[],
  conversationId?: string,
  model: string = 'deepseek-chat',
  onChunk?: (chunk: StreamChunk) => void,
  signal?: AbortSignal
): Promise<void> {
  logger.info('开始发送消息', { 
    conversationId, 
    model, 
    messagesCount: messages.length
  });

  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages, conversation_id: conversationId, model }),
      signal
    });

    if (!response.ok) {
      const error = await response.json();
      logger.error('API请求失败', { 
        status: response.status, 
        statusText: response.statusText,
        error 
      });
      throw new Error(error.detail || '发送消息失败');
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      logger.error('无法读取响应流');
      throw new Error('无法读取响应流');
    }

    try {
      logger.info(`开始处理响应流`, { model });
      let isDone = false;
      let chunkCount = 0;
      
      while (!isDone) {
        const { done, value } = await reader.read();
        if (done) {
          logger.info('响应流结束', { chunkCount });
          // 如果没有收到 done 消息但流结束了，发送一个 done 消息
          if (!isDone) {
            onChunk?.({ type: 'done', content: '' });
          }
          break;
        }

        chunkCount++;
        
        // 只在每10个数据块记录一次，减少日志量
        if (chunkCount % 10 === 0) {
          logger.info(`已处理 ${chunkCount} 个数据块`);
        }
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6);
              const data = JSON.parse(jsonStr);
              
              // 只记录错误和完成信号，减少日志量
              if (data.type === 'error') {
                logger.error('收到错误块', { error: data.content });
              } else if (data.type === 'done') {
                logger.info('收到完成信号');
                isDone = true;
              }
              
              onChunk?.(data);
            } catch (e) {
              logger.error('解析SSE数据失败', { error: e });
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      logger.warn('请求被用户中断', { conversationId, model });
    } else {
      logger.error('发送消息时发生错误', { 
        error: error.message, 
        conversationId, 
        model
      });
    }
    throw error;
  }
}

/**
 * 创建新对话
 */
export async function createConversation(): Promise<Conversation> {
  logger.info('创建新对话');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/create`, {
      method: 'POST',
    });

    if (!response.ok) {
      logger.error('创建对话失败', { 
        status: response.status, 
        statusText: response.statusText 
      });
      throw new Error('创建对话失败');
    }

    const data = await response.json();
    logger.info('对话创建成功', { conversationId: data.id });
    return data;
  } catch (error) {
    logger.error('创建对话时发生错误', { error, stack: error.stack });
    throw error;
  }
}

/**
 * 获取历史对话
 */
export async function getHistory(): Promise<Conversation[]> {
  logger.info('获取历史对话');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/history`);

    if (!response.ok) {
      logger.error('获取历史记录失败', { 
        status: response.status, 
        statusText: response.statusText 
      });
      throw new Error('获取历史记录失败');
    }

    const data = await response.json();
    logger.info('历史对话获取成功', { conversationCount: data.length });
    return data;
  } catch (error) {
    logger.error('获取历史对话时发生错误', { error, stack: error.stack });
    throw error;
  }
}

/**
 * 获取可用模型列表
 */
export async function getModels(): Promise<Model[]> {
  logger.info('获取模型列表');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/models`);

    if (!response.ok) {
      logger.error('获取模型列表失败', { 
        status: response.status, 
        statusText: response.statusText 
      });
      throw new Error('获取模型列表失败');
    }

    const data = await response.json();
    logger.info('模型列表获取成功', { modelCount: data.models.length });
    return data.models;
  } catch (error) {
    logger.error('获取模型列表时发生错误', { error, stack: error.stack });
    throw error;
  }
} 