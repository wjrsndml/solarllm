import { Message, ChatResponse, Conversation } from '../types/chat';

const API_BASE_URL = 'http://localhost:8000';

export async function sendMessage(messages: Message[], conversationId?: string): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE_URL}/api/chat/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages, conversation_id: conversationId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '发送消息失败');
  }

  return response.json();
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