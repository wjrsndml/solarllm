"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, MessageSquare, Settings, ChevronDown, ChevronUp } from "lucide-react";
import axios from "axios";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  error?: boolean;
  showParamTable?: boolean;
  paramData?: any;
}

interface AIChartProps {
  pageType: "solar" | "aging" | "perovskite" | "bandgap";
  currentParams?: any;
  onSimulation?: (params: any) => Promise<any>;
  className?: string;
}

export default function AIChat({ pageType, currentParams, onSimulation, className = "" }: AIChartProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `你好！我是您的AI助手，专门帮助您进行${getPageName(pageType)}。我可以帮您：\n\n• 调整和优化参数\n• 进行仿真计算\n• 分析结果和趋势\n• 回答技术问题\n\n有什么我可以帮助您的吗？`,
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showParamConfirm, setShowParamConfirm] = useState(false);
  const [pendingParams, setPendingParams] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function getPageName(type: string): string {
    const names = {
      solar: "硅电池参数预测",
      aging: "钙钛矿老化预测", 
      perovskite: "钙钛矿参数预测",
      bandgap: "钙钛矿带隙预测"
    };
    return names[type as keyof typeof names] || "参数预测";
  }

  // 检测用户是否想要进行仿真
  const detectSimulationIntent = (message: string): boolean => {
    const simulationKeywords = [
      "仿真", "计算", "预测", "运行", "执行", "开始", "模拟", "分析"
    ];
    return simulationKeywords.some(keyword => message.includes(keyword));
  };

  // 参数确认表格组件
  const ParameterConfirmTable = ({ params, onConfirm, onCancel }: {
    params: any;
    onConfirm: (params: any) => void;
    onCancel: () => void;
  }) => {
    const [editedParams, setEditedParams] = useState(params);
    const [showParamModal, setShowParamModal] = useState(false);

    // 确保参数是数字类型
    useEffect(() => {
      const numericParams: any = {};
      Object.entries(params).forEach(([key, value]) => {
        numericParams[key] = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
      });
      setEditedParams(numericParams);
    }, [params]);

    // 格式化数值显示：科学计数法用于大数和小数
    const formatValueForDisplay = (value: number): string => {
      if (value === 0) return "0";
      if (Math.abs(value) > 1e6 || (Math.abs(value) < 1e-3 && value !== 0)) {
        return value.toExponential(2);
      }
      return value.toString();
    };

    // 解析输入值
    const parseInputValue = (value: string): number => {
      if (!value.trim()) return 0;
      
      // 尝试解析科学计数法和普通数字
      const num = parseFloat(value);
      return isNaN(num) ? 0 : num;
    };

    // 参数修改弹窗
    const ParameterModal = () => (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">修改参数</h3>
          <div className="space-y-3">
            {Object.entries(editedParams).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 flex-shrink-0 mr-2">{key}:</label>
                <input
                  type="text"
                  value={formatValueForDisplay(typeof value === 'number' ? value : parseFloat(String(value)) || 0)}
                  onChange={(e) => {
                    const newValue = parseInputValue(e.target.value);
                    setEditedParams((prev: any) => ({ ...prev, [key]: newValue }));
                  }}
                  className="w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-right"
                  placeholder="0"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={() => setShowParamModal(false)}
              className="px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    );

    const handleConfirm = () => {
      // 确保所有参数都是数字类型
      const finalParams: any = {};
      Object.entries(editedParams).forEach(([key, value]) => {
        finalParams[key] = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
      });
      console.log('确认仿真参数:', finalParams);
      onConfirm(finalParams);
    };

    return (
      <>
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Settings className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-800">确认仿真参数</span>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            检测到 {Object.keys(params).length} 个参数。您可以使用当前参数直接仿真，或先修改参数再仿真。
          </p>
          
          {/* 参数预览 */}
          <div className="bg-white/60 rounded-lg p-3 mb-4 max-h-32 overflow-y-auto">
            <div className="text-xs text-gray-500 mb-2">当前参数预览：</div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {Object.entries(editedParams).slice(0, 6).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-gray-600">{key}:</span>
                  <span className="font-mono text-gray-800">
                    {formatValueForDisplay(typeof value === 'number' ? value : parseFloat(String(value)) || 0)}
                  </span>
                </div>
              ))}
              {Object.keys(editedParams).length > 6 && (
                <div className="col-span-2 text-center text-gray-500">
                  ... 还有 {Object.keys(editedParams).length - 6} 个参数
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-between gap-2">
            <button
              onClick={() => setShowParamModal(true)}
              className="flex-1 px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
            >
              修改参数
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 text-sm text-white bg-blue-500 rounded hover:bg-blue-600 transition-colors"
            >
              确认仿真
            </button>
          </div>
        </div>
        
        {showParamModal && <ParameterModal />}
      </>
    );
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput("");

    // 检测是否是仿真请求
    if (detectSimulationIntent(currentInput) && currentParams && onSimulation) {
      // 显示参数确认表格
      setShowParamConfirm(true);
      setPendingParams(currentParams);
      
      const confirmMessage: Message = {
        role: "assistant", 
        content: "我检测到您想要进行仿真。请确认以下参数，您可以在表格中修改参数值：",
        timestamp: new Date(),
        showParamTable: true,
        paramData: currentParams
      };
      
      setMessages(prev => [...prev, confirmMessage]);
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post("/api/chat", {
        message: currentInput,
        model: "deepseek-chat",
        history: messages,
        context: {
          pageType,
          currentParams
        }
      }, {
        timeout: 30000,
      });

      const assistantMessage: Message = {
        role: "assistant",
        content: response.data.content || "抱歉，我无法生成回复。",
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      
      const errorMessage: Message = {
        role: "assistant",
        content: "抱歉，发生了错误。请稍后重试。",
        timestamp: new Date(),
        error: true,
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleParamConfirm = async (confirmedParams: any) => {
    setShowParamConfirm(false);
    setPendingParams(null);
    
    if (onSimulation) {
      setIsLoading(true);
      
      // 添加开始仿真的消息
      const startMessage: Message = {
        role: "assistant",
        content: "正在使用您确认的参数进行仿真计算...",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, startMessage]);
      
      try {
        const result = await onSimulation(confirmedParams);
        
        const resultMessage: Message = {
          role: "assistant",
          content: result.success 
            ? `仿真完成！✨\n\n参数已应用并重新生成结果。您可以在左侧查看更新的TOPCon模型参数，在中间查看新的预测结果和J-V曲线。\n\n${result.predictions ? `转换效率: ${result.predictions.Eff?.toFixed(2)}%` : ''}` 
            : `仿真失败：${result.error || "未知错误"}`,
          timestamp: new Date(),
          error: !result.success
        };
        
        setMessages(prev => [...prev, resultMessage]);
      } catch (error) {
        const errorMessage: Message = {
          role: "assistant", 
          content: "仿真过程中发生错误，请重试。",
          timestamp: new Date(),
          error: true
        };
        
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleParamCancel = () => {
    setShowParamConfirm(false);
    setPendingParams(null);
    
    const cancelMessage: Message = {
      role: "assistant",
      content: "已取消仿真。如需要，您可以调整参数后再次尝试。",
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, cancelMessage]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={`bg-white/30 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden flex flex-col ${className}`}>
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-white/20 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">AI助手</h3>
            <p className="text-xs text-gray-600">{getPageName(pageType)}</p>
          </div>
        </div>
        
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-lg hover:bg-white/20 transition-colors"
        >
          {isCollapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* 对话区域 */}
      {!isCollapsed && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                {message.role === "assistant" && (
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}
                
                <div className={`max-w-[80%] ${message.role === "user" ? "order-first" : ""}`}>
                  <div
                    className={`p-3 rounded-2xl ${
                      message.role === "user"
                        ? "bg-blue-500 text-white"
                        : message.error
                        ? "bg-red-50 text-red-800 border border-red-200"
                        : "bg-white/50 text-gray-800"
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                    
                    {/* 参数确认表格 */}
                    {message.showParamTable && showParamConfirm && pendingParams && (
                      <div className="mt-3">
                        <ParameterConfirmTable
                          params={pendingParams}
                          onConfirm={handleParamConfirm}
                          onCancel={handleParamCancel}
                        />
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 px-1">
                    {formatTime(message.timestamp)}
                  </div>
                </div>

                {message.role === "user" && (
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-white/50 p-3 rounded-2xl">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* 输入区域 */}
          <div className="p-4 border-t border-white/20 flex-shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="输入您的问题或要求..."
                className="flex-1 px-3 py-2 bg-white/50 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all text-sm"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}