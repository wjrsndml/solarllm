"use client";

import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SendIcon } from 'lucide-react';
import { Model } from '@/lib/api';

interface ChatInputProps {
  isLoading: boolean;
  onSubmit: (message: string) => void;
  models: Model[];
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}

export function ChatInput({ isLoading, onSubmit, models, selectedModel, onModelChange }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;
    
    onSubmit(message);
    setMessage('');
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium">选择模型:</div>
        <div className="flex space-x-2">
          {models.map((model) => (
            <Button
              key={model.id}
              type="button"
              variant={selectedModel === model.id ? "default" : "outline"}
              size="sm"
              onClick={() => onModelChange(model.id)}
              title={model.description}
            >
              {model.name}
            </Button>
          ))}
        </div>
      </div>
      
      <div className="flex items-end space-x-2">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="输入您的问题..."
          className="min-h-24 resize-none flex-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <Button 
          type="submit" 
          size="icon" 
          disabled={isLoading || !message.trim()}
        >
          <SendIcon className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        按Enter发送，Shift+Enter换行
      </div>
    </form>
  );
} 