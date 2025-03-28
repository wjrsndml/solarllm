"use client";

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { User, Bot } from 'lucide-react';
import Image from 'next/image';

interface ImageData {
  tool_name: string;
  source_path: string;
  url_path: string;
  image_index: number;
  format: string;
}

interface ChatMessageProps {
  message: {
    role: string;
    content: string;
    reasoning_content?: string;
    images?: ImageData[];
  };
  isLoading?: boolean;
}

export function ChatMessage({ message, isLoading }: ChatMessageProps) {
  const isUser = message.role === 'user';
  
  // 处理消息中的换行符
  const formattedContent = React.useMemo(() => {
    if (!message.content) return '';
    return message.content.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line}
        {i < message.content.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  }, [message.content]);

  // 渲染推理内容（如果有）
  const renderReasoning = () => {
    if (!message.reasoning_content) return null;
    
    return (
      <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm">
        <p className="font-semibold mb-1">推理过程：</p>
        <p className="whitespace-pre-wrap">{message.reasoning_content}</p>
      </div>
    );
  };

  // 渲染图片（如果有）
  const renderImages = () => {
    if (!message.images || message.images.length === 0) return null;
    
    return (
      <div className="mt-4 flex flex-wrap gap-4">
        {message.images.map((image, index) => (
          <div key={index} className="relative">
            <Image 
              src={image.url_path}
              alt={`图片 ${index + 1}`}
              width={400} 
              height={300}
              className="rounded-md border border-gray-200 dark:border-gray-700"
            />
            <p className="text-xs text-gray-500 mt-1">{image.tool_name} 生成的图片 #{image.image_index + 1}</p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      className={cn(
        'flex gap-3 p-4 w-full', 
        isUser ? 'bg-white dark:bg-gray-950' : 'bg-gray-50 dark:bg-gray-900'
      )}
    >
      {/* 头像 */}
      <Avatar className="h-8 w-8">
        {isUser ? (
          <>
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </>
        ) : (
          <>
            <AvatarFallback>
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          </>
        )}
      </Avatar>
      
      {/* 消息内容 */}
      <div className="flex-1 space-y-2">
        <div className="font-semibold">
          {isUser ? '用户' : 'AI助手'}
        </div>
        
        <div className="prose dark:prose-invert max-w-none">
          {isLoading && !message.content ? (
            <div className="flex items-center">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          ) : (
            <div className="whitespace-pre-wrap">{formattedContent}</div>
          )}
          
          {renderReasoning()}
          {renderImages()}
        </div>
      </div>
    </div>
  );
} 