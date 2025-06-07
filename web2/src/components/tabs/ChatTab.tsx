"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, RefreshCw, Plus, History, Sparkles, Mic, Image as ImageIcon, Brain, FileText, X, Clock } from "lucide-react";
import axios from "axios";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  error?: boolean;
  images?: any[];
  reasoning?: string;
  context?: any[];
}

interface Model {
  id: string;
  name: string;
}

interface HistoryItem {
  id: string;
  title: string;
  created_at: string;
  messages: any[];
}

export default function ChatTab() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("deepseek-chat");
  const [availableModels, setAvailableModels] = useState<Model[]>([
    { id: 'deepseek-chat', name: 'DeepSeek Chat' }
  ]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 获取可用模型列表
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await axios.get('/api/models');
        if (response.data.success && response.data.models.length > 0) {
          setAvailableModels(response.data.models);
          // 如果当前选择的模型不在列表中，选择第一个
          if (!response.data.models.find((m: Model) => m.id === selectedModel)) {
            setSelectedModel(response.data.models[0].id);
          }
        }
      } catch (error) {
        console.warn('获取模型列表失败，使用默认模型:', error);
      }
    };

    fetchModels();
  }, [selectedModel]);

  // 获取历史记录
  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await axios.get('/api/chat/history');
      if (response.data.success) {
        setHistoryList(response.data.history);
      }
    } catch (error) {
      console.error('获取历史记录失败:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // 加载历史对话
  const loadHistoryConversation = async (historyItem: HistoryItem) => {
    try {
      // 转换历史消息格式
      const formattedMessages: Message[] = [];
      
      for (const msg of historyItem.messages) {
        if (msg.role === 'system') continue; // 跳过系统消息
        
        formattedMessages.push({
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp || historyItem.created_at),
          images: msg.images,
          reasoning: msg.reasoning_content,
          context: msg.context
        });
      }
      
      setMessages(formattedMessages);
      setShowHistory(false);
    } catch (error) {
      console.error('加载历史对话失败:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);

    try {
      console.log('发送消息:', currentInput);
      console.log('历史消息数量:', messages.length);
      
      const response = await axios.post("/api/chat", {
        message: currentInput,
        model: selectedModel,
        history: messages,
      }, {
        timeout: 60000, // 60秒超时
      });

      console.log('API响应:', response.data);

      if (response.data.error) {
        const errorMessage: Message = {
          role: "assistant",
          content: response.data.content,
          timestamp: new Date(),
          error: true,
        };
        setMessages((prev) => [...prev, errorMessage]);
      } else {
        const assistantMessage: Message = {
          role: "assistant",
          content: response.data.content || "抱歉，我无法生成回复。",
          timestamp: new Date(),
          images: response.data.images,
          reasoning: response.data.reasoning,
          context: response.data.context,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      
      let errorContent = "抱歉，发生了错误。";
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          errorContent = "无法连接到服务器。请检查服务器是否正在运行。";
        } else if (error.code === 'TIMEOUT') {
          errorContent = "请求超时。请稍后重试。";
        } else if (error.response) {
          errorContent = `服务器错误: ${error.response.status} ${error.response.statusText}`;
        } else if (error.request) {
          errorContent = "网络错误。请检查网络连接。";
        } else {
          errorContent = `请求错误: ${error.message}`;
        }
      }
      
      const errorMessage: Message = {
        role: "assistant",
        content: errorContent,
        timestamp: new Date(),
        error: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatHistoryTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 渲染消息内容，支持Markdown图片
  const renderMessageContent = (content: string, images?: any[]) => {
    // 处理Markdown图片语法
    const parts = content.split(/!\[([^\]]*)\]\(([^)]+)\)/g);
    const elements = [];
    
    for (let i = 0; i < parts.length; i += 3) {
      // 添加文本部分
      if (parts[i]) {
        elements.push(
          <span key={`text-${i}`} className="whitespace-pre-wrap leading-relaxed">
            {parts[i]}
          </span>
        );
      }
      
      // 添加图片部分
      if (parts[i + 1] !== undefined && parts[i + 2]) {
        const altText = parts[i + 1];
        const imageUrl = parts[i + 2];
        elements.push(
          <div key={`img-${i}`} className="my-4">
            <div className="bg-white/10 rounded-lg p-3 border border-white/20">
              <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                <ImageIcon className="h-4 w-4" />
                <span>{altText || '生成的图片'}</span>
              </div>
              <img
                src={imageUrl}
                alt={altText}
                className="max-w-full h-auto rounded-lg shadow-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  // 显示错误信息
                  const errorDiv = document.createElement('div');
                  errorDiv.className = 'text-red-500 text-sm p-2 bg-red-50 rounded border';
                  errorDiv.textContent = `图片加载失败: ${imageUrl}`;
                  target.parentNode?.appendChild(errorDiv);
                }}
              />
            </div>
          </div>
        );
      }
    }
    
    return elements.length > 0 ? elements : content;
  };

  return (
    <div className="h-full flex flex-col relative">
      {/* 历史记录侧边栏 */}
      {showHistory && (
        <div className="absolute inset-0 z-50 flex">
          <div className="w-80 bg-white/95 backdrop-blur-xl border-r border-white/30 shadow-2xl">
            <div className="p-4 border-b border-white/20">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">历史对话</h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  </div>
                </div>
              ) : historyList.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>暂无历史记录</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {historyList.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => loadHistoryConversation(item)}
                      className="w-full text-left p-3 rounded-lg bg-white/40 hover:bg-white/60 border border-white/30 transition-all duration-200 group"
                    >
                      <div className="font-medium text-gray-800 truncate group-hover:text-gray-900">
                        {item.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                        <Clock className="h-3 w-3" />
                        <span>{formatHistoryTime(item.created_at)}</span>
                        <span>•</span>
                        <span>{item.messages.length} 条消息</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* 点击遮罩关闭 */}
          <div 
            className="flex-1 bg-black/20 backdrop-blur-sm"
            onClick={() => setShowHistory(false)}
          />
        </div>
      )}

      {/* 头部区域 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              💬 AI智能对话
            </h2>
            <p className="text-gray-600/80">与AI助手进行智能对话，获取专业建议</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* 连接状态指示器 */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs ${
            isLoading 
              ? "bg-yellow-100 text-yellow-800" 
              : messages.some(m => m.error) 
                ? "bg-red-100 text-red-800"
                : "bg-green-100 text-green-800"
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isLoading 
                ? "bg-yellow-500 animate-pulse" 
                : messages.some(m => m.error)
                  ? "bg-red-500"
                  : "bg-green-500 animate-pulse"
            }`}></div>
            <span>
              {isLoading ? "处理中..." : messages.some(m => m.error) ? "连接异常" : "已连接"}
            </span>
          </div>

          {/* 模型选择器 */}
          <div className="relative">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="appearance-none bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
            >
              {availableModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-2">
            <button
              onClick={clearChat}
              className="p-2.5 text-gray-500 hover:text-gray-700 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl border border-white/30 transition-all duration-300 group"
              title="清除对话"
            >
              <RefreshCw className="h-4 w-4 group-hover:rotate-180 transition-transform duration-300" />
            </button>
            <button
              className="p-2.5 text-gray-500 hover:text-gray-700 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl border border-white/30 transition-all duration-300"
              title="新建对话"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setShowHistory(true);
                fetchHistory();
              }}
              className="p-2.5 text-gray-500 hover:text-gray-700 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl border border-white/30 transition-all duration-300"
              title="历史对话"
            >
              <History className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 聊天区域 */}
      <div className="flex-1 flex flex-col gradient-card rounded-2xl overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-float">
                  <Bot className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">开始对话吧！</h3>
                <p className="text-gray-600 mb-6">您可以询问关于太阳能电池的任何问题</p>
                
                {/* 快速开始建议 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-md mx-auto">
                  {[
                    "钙钛矿电池的优势是什么？",
                    "如何提高太阳能电池效率？",
                    "硅电池与钙钛矿电池的区别",
                    "电池老化的主要原因"
                  ].map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => setInput(suggestion)}
                      className="text-left p-3 text-sm bg-white/40 hover:bg-white/60 backdrop-blur-sm rounded-lg border border-white/30 transition-all duration-300 hover:scale-105"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-4 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`flex gap-4 max-w-[85%] ${
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {/* 头像 */}
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                      message.role === "user"
                        ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white"
                        : message.error
                          ? "bg-gradient-to-br from-red-400 to-red-600 text-white"
                          : "bg-gradient-to-br from-gray-400 to-gray-600 text-white"
                    }`}
                  >
                    {message.role === "user" ? (
                      <User className="h-5 w-5" />
                    ) : (
                      <Bot className="h-5 w-5" />
                    )}
                  </div>
                  
                  {/* 消息气泡 */}
                  <div
                    className={`rounded-2xl p-4 shadow-lg backdrop-blur-sm border ${
                      message.role === "user"
                        ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white border-blue-400/30"
                        : message.error
                          ? "bg-gradient-to-br from-red-50 to-red-100 text-red-800 border-red-200"
                          : "bg-white/80 text-gray-800 border-white/50"
                    }`}
                  >
                    {/* 主要内容 */}
                    <div className="leading-relaxed">
                      {renderMessageContent(message.content, message.images)}
                    </div>

                    {/* 推理过程 */}
                    {message.reasoning && (
                      <details className="mt-4 p-3 bg-white/20 rounded-lg border border-white/30">
                        <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                          <Brain className="h-4 w-4" />
                          推理过程
                        </summary>
                        <div className="mt-2 text-sm whitespace-pre-wrap text-gray-700">
                          {message.reasoning}
                        </div>
                      </details>
                    )}

                    {/* 上下文信息 */}
                    {message.context && message.context.length > 0 && (
                      <details className="mt-4 p-3 bg-white/20 rounded-lg border border-white/30">
                        <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                          <FileText className="h-4 w-4" />
                          参考信息 ({message.context.length})
                        </summary>
                        <div className="mt-2 space-y-2">
                          {message.context.map((ctx: any, idx: number) => (
                            <div key={idx} className="text-sm p-2 bg-white/30 rounded border border-white/20">
                              <div className="font-medium text-gray-800">{ctx.title || `参考 ${idx + 1}`}</div>
                              <div className="text-gray-600 text-xs mt-1">{ctx.content}</div>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}

                    {/* 时间戳 */}
                    <div
                      className={`text-xs mt-3 ${
                        message.role === "user"
                          ? "text-blue-100"
                          : message.error
                            ? "text-red-600"
                            : "text-gray-500"
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          
          {/* 加载指示器 */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-4 max-w-[80%]">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 text-white flex items-center justify-center shadow-lg">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="bg-white/80 text-gray-800 shadow-lg backdrop-blur-sm border border-white/50 rounded-2xl p-4">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入区域 */}
        <div className="p-6 border-t border-white/20 bg-white/5 backdrop-blur-sm">
          <div className="flex gap-3">
            <button className="p-3 text-gray-500 hover:text-gray-700 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl border border-white/30 transition-all duration-300">
              <Mic className="h-5 w-5" />
            </button>
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="输入您的问题..."
                className="w-full resize-none bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl px-4 py-3 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 placeholder-gray-500"
                rows={1}
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 button-primary"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 