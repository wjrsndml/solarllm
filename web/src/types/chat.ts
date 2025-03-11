export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoning_content?: string;
}

export interface ChatResponse {
  role: 'assistant';
  content: string;
  reasoning_content?: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  messages: Message[];
}

export interface Model {
  id: string;
  name: string;
  description: string;
}

export interface StreamChunk {
  type: 'content' | 'reasoning' | 'error' | 'done';
  content: string;
} 