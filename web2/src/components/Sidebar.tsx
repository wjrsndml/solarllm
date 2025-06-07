"use client";

import { MessageCircle, Zap, Clock, FlaskConical, Gem, ChevronRight } from "lucide-react";
import { TabType } from "@/app/page";

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

const navItems = [
  {
    id: "chat" as TabType,
    icon: MessageCircle,
    label: "AI对话",
    description: "智能问答助手",
    gradient: "from-blue-500 to-cyan-500",
    color: "text-blue-600",
  },
  {
    id: "solar" as TabType,
    icon: Zap,
    label: "硅电池参数预测",
    description: "JV曲线分析",
    gradient: "from-yellow-500 to-orange-500",
    color: "text-yellow-600",
  },
  {
    id: "aging" as TabType,
    icon: Clock,
    label: "钙钛矿老化预测",
    description: "稳定性分析",
    gradient: "from-green-500 to-emerald-500",
    color: "text-green-600",
  },
  {
    id: "perovskite" as TabType,
    icon: FlaskConical,
    label: "钙钛矿参数预测",
    description: "材料性能预测",
    gradient: "from-purple-500 to-pink-500",
    color: "text-purple-600",
  },
  {
    id: "bandgap" as TabType,
    icon: Gem,
    label: "钙钛矿带隙预测",
    description: "能带结构分析",
    gradient: "from-indigo-500 to-blue-500",
    color: "text-indigo-600",
  },
];

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  return (
    <div className="w-64 glass-morphism rounded-2xl p-5 backdrop-blur-xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">⚡</span>
          </div>
          <h2 className="text-lg font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            功能导航
          </h2>
        </div>
        <p className="text-xs text-gray-600/80">选择需要使用的AI分析功能</p>
      </div>
      
      <nav className="space-y-2">
        {navItems.map((item, index) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`
                group w-full text-left p-3 rounded-xl transition-all duration-300 border
                sidebar-item relative overflow-hidden
                ${isActive
                  ? "active bg-white/40 border-white/40 shadow-lg scale-[1.02]"
                  : "bg-white/20 hover:bg-white/30 border-white/20 hover:border-white/30 hover:scale-[1.01]"
                }
              `}
              style={{
                animationDelay: `${index * 100}ms`
              }}
            >
              <div className="relative z-10 flex items-center gap-3">
                <div
                  className={`
                    p-2 rounded-lg transition-all duration-300
                    ${isActive
                      ? `bg-gradient-to-br ${item.gradient} text-white shadow-lg`
                      : "bg-white/50 text-gray-600 group-hover:bg-white/70"
                    }
                  `}
                >
                  <IconComponent className="h-4 w-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3
                    className={`
                      font-medium transition-colors duration-300 truncate text-sm
                      ${isActive ? "text-gray-900" : "text-gray-800 group-hover:text-gray-900"}
                    `}
                  >
                    {item.label}
                  </h3>
                  <p
                    className={`
                      text-xs transition-colors duration-300 truncate
                      ${isActive ? "text-gray-700" : "text-gray-600 group-hover:text-gray-700"}
                    `}
                  >
                    {item.description}
                  </p>
                </div>

                <ChevronRight 
                  className={`
                    h-3 w-3 transition-all duration-300 flex-shrink-0
                    ${isActive 
                      ? "text-gray-700 rotate-90" 
                      : "text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1"
                    }
                  `}
                />
              </div>

              {/* 活跃状态指示器 */}
              {isActive && (
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-r-full"></div>
              )}
            </button>
          );
        })}
      </nav>

      {/* 底部装饰 */}
      <div className="mt-6 pt-4 border-t border-white/20">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>功能模块已就绪</span>
        </div>
      </div>
    </div>
  );
} 