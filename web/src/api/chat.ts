import { Message, ChatResponse } from '../types/chat';

const API_BASE_URL = 'http://localhost:8000';

export async function sendMessage(messages: Message[]): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE_URL}/api/chat/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '发送消息失败');
  }

  return response.json();
} 