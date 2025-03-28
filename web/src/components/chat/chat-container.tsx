"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Conversation, Message, Model, createConversation, getConversationHistory, getAvailableModels, sendMessage } from '@/lib/api';
import { ChatInput } from './chat-input';
import { ChatMessage } from './chat-message';
import { ChatHistory } from './chat-history';
import { toast } from 'sonner';

export function ChatContainer() {
  // 状态管理
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState('deepseek-chat');
  const [streamingMessage, setStreamingMessage] = useState<Message | null>(null);
  
  // 图片处理
  const [messageImages, setMessageImages] = useState<Record<string, any[]>>({});

  // refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 初始加载对话历史和模型
  useEffect(() => {
    loadConversations();
    loadModels();
  }, []);

  // 消息更新时滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  // 活跃对话变更时更新消息
  useEffect(() => {
    if (activeConversation) {
      setMessages(activeConversation.messages || []);
      setStreamingMessage(null); // 确保切换对话时清理流式消息
    } else {
      setMessages([]);
      setStreamingMessage(null);
    }
  }, [activeConversation]);

  // 加载对话历史
  const loadConversations = async () => {
    try {
      const conversationsData = await getConversationHistory();
      setConversations(conversationsData);
      
      // 如果有对话，选择最新的一个
      if (conversationsData.length > 0) {
        const sortedConversations = [...conversationsData].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setActiveConversation(sortedConversations[0]);
      }
    } catch (error) {
      console.error('加载对话历史失败:', error);
      toast.error('加载对话历史失败');
    }
  };

  // 加载可用模型
  const loadModels = async () => {
    try {
      const modelsData = await getAvailableModels();
      setModels(modelsData);
      
      // 如果有模型，选择第一个作为默认
      if (modelsData.length > 0) {
        setSelectedModel(modelsData[0].id);
      }
    } catch (error) {
      console.error('加载模型列表失败:', error);
      toast.error('加载模型列表失败');
    }
  };

  // 创建新对话
  const handleNewConversation = async () => {
    try {
      const newConversation = await createConversation();
      setConversations([newConversation, ...conversations]);
      setActiveConversation(newConversation);
    } catch (error) {
      console.error('创建新对话失败:', error);
      toast.error('创建新对话失败');
    }
  };

  // 选择对话
  const handleSelectConversation = (conversationId: string) => {
    const selected = conversations.find(conv => conv.id === conversationId);
    if (selected) {
      setActiveConversation(selected);
    }
  };

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 处理消息提交
  const handleSubmit = async (content: string) => {
    if (!activeConversation) {
      try {
        const newConversation = await createConversation();
        setConversations([newConversation, ...conversations]);
        setActiveConversation(newConversation);
        setTimeout(() => sendUserMessage(content, newConversation.id), 0);
      } catch (error) {
        console.error('创建新对话失败:', error);
        toast.error('创建新对话失败');
      }
      return;
    }

    sendUserMessage(content, activeConversation.id);
  };

  // 发送用户消息
  const sendUserMessage = async (content: string, conversationId: string) => {
    // 创建用户消息
    const userMessage: Message = {
      role: 'user',
      content,
    };

    // 更新UI
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    
    // 初始化流式响应消息
    const initialStreamingMessage: Message = {
      role: 'assistant',
      content: '',
      images: [],
    };
    setStreamingMessage(initialStreamingMessage);
    
    // 设置加载状态
    setIsLoading(true);
    
    // 创建abort controller用于可能的取消
    abortControllerRef.current = new AbortController();
    
    try {
      // 收集当前图片状态，开始新消息时清空
      setMessageImages({ ...messageImages, [updatedMessages.length]: [] });
      
      // 发送消息到服务器
      await sendMessage(
        updatedMessages,
        conversationId,
        selectedModel,
        handleStreamResponse
      );
    } catch (error) {
      console.error('发送消息失败:', error);
      toast.error('发送消息失败');
      
      // 错误时更新UI
      setStreamingMessage(prev => 
        prev ? { ...prev, content: prev.content + '\n\n发送失败，请重试。' } : null
      );
    } finally {
      // 完成后状态清理
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // 处理流式响应
  const handleStreamResponse = (type: string, content: any) => {
    switch (type) {
      case 'content':
        // 文本内容更新
        setStreamingMessage(prev => 
          prev ? { ...prev, content: (prev.content || '') + content } : null
        );
        break;
        
      case 'reasoning':
        // 推理内容更新
        setStreamingMessage(prev => 
          prev ? { ...prev, reasoning_content: content } : null
        );
        break;
        
      case 'image':
        // 图片处理 - 使用一个稳定的键名"assistant"存储助手消息的图片
        const currentImages = messageImages["assistant"] || [];
        setMessageImages({
          ...messageImages,
          "assistant": [...currentImages, content]
        });
        
        // 更新流式消息中的图片
        setStreamingMessage(prev => 
          prev ? { ...prev, images: [...(prev.images || []), content] } : null
        );
        break;
        
      case 'context':
        // 上下文信息处理
        // 可以在UI中显示或者仅用于日志
        console.log('收到上下文信息:', content);
        break;
        
      case 'error':
        // 错误处理
        toast.error(`错误: ${content}`);
        setStreamingMessage(prev => 
          prev ? { ...prev, content: prev.content + `\n\n错误: ${content}` } : null
        );
        break;
        
      case 'done':
        // 完成响应，更新消息列表
        if (streamingMessage) {
          const finalMessage = { ...streamingMessage };
          // 使用新的键名获取图片
          if (messageImages["assistant"] && messageImages["assistant"].length > 0) {
            finalMessage.images = messageImages["assistant"];
          }
          
          // 更新消息列表
          const updatedMessages = [...messages, finalMessage];
          setMessages(updatedMessages);
          setStreamingMessage(null);
          
          // 更新本地对话历史
          if (activeConversation) {
            // 确保我们包含用户的最后一条消息和AI的回复
            const lastUserMessage = messages[messages.length - 1];
            const updatedConversation = {
              ...activeConversation,
              messages: [...activeConversation.messages, lastUserMessage, finalMessage]
            };
            
            const updatedConversations = conversations.map(conv => 
              conv.id === updatedConversation.id ? updatedConversation : conv
            );
            
            setActiveConversation(updatedConversation);
            setConversations(updatedConversations);
          }
          
          // 清空图片缓存
          setMessageImages({});
        }
        break;
        
      default:
        console.log(`未处理的响应类型: ${type}`, content);
    }
  };

  // 渲染所有消息
  const renderMessages = () => {
    // 常规消息
    const messageElements = messages.map((message, index) => {
      // 只有助手消息才可能有图片
      if (message.role === 'assistant') {
        const msgWithImages = { 
          ...message, 
          images: messageImages["assistant"] || [] 
        };
        return <ChatMessage key={`msg-${index}`} message={msgWithImages} />;
      }
      // 用户消息不添加图片
      return <ChatMessage key={`msg-${index}`} message={message} />;
    });
    
    // 流式消息（如果有）
    if (streamingMessage) {
      // 添加图片到流式消息
      const streamingWithImages = {
        ...streamingMessage,
        images: messageImages["assistant"] || []
      };
      messageElements.push(
        <ChatMessage 
          key="streaming" 
          message={streamingWithImages} 
          isLoading={isLoading} 
        />
      );
    }
    
    return messageElements;
  };

  return (
    <div className="flex h-screen bg-white dark:bg-gray-950">
      {/* 聊天历史侧边栏 */}
      <ChatHistory
        conversations={conversations}
        activeConversationId={activeConversation?.id || null}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
      />
      
      {/* 主聊天区域 */}
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        {/* 顶部标题栏 */}
        <div className="border-b border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">
            {activeConversation?.title || '新对话'}
          </h1>
        </div>
        
        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !streamingMessage ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-6 max-w-md">
                <h2 className="text-2xl font-bold mb-2">欢迎使用Solar AI助手</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  可以向我询问太阳能电池相关问题，我会尽力帮助您解答。
                </p>
              </div>
            </div>
          ) : (
            renderMessages()
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* 聊天输入框 */}
        <ChatInput
          isLoading={isLoading}
          onSubmit={handleSubmit}
          models={models}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
        />
      </div>
    </div>
  );
} 