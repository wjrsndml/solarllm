export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  role: 'assistant';
  content: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  messages: Message[];
} 