import { Message, ChatResponse, Conversation, Model, StreamChunk } from '../types/chat';

const API_BASE_URL = 'http://localhost:8000';

export async function sendMessage(
  messages: Message[],
  conversationId?: string,
  model: string = 'deepseek-chat',
  onChunk?: (chunk: StreamChunk) => void
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/chat/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages, conversation_id: conversationId, model }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '发送消息失败');
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error('无法读取响应流');
  }

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          onChunk?.(data);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function createConversation(): Promise<Conversation> {
  const response = await fetch(`${API_BASE_URL}/api/chat/create`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('创建对话失败');
  }

  return response.json();
}

export async function getHistory(): Promise<Conversation[]> {
  const response = await fetch(`${API_BASE_URL}/api/chat/history`);

  if (!response.ok) {
    throw new Error('获取历史记录失败');
  }

  return response.json();
}

export async function getModels(): Promise<Model[]> {
  const response = await fetch(`${API_BASE_URL}/api/models`);

  if (!response.ok) {
    throw new Error('获取模型列表失败');
  }

  const data = await response.json();
  return data.models;
} 