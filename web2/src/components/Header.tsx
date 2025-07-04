"use client";

import { Sun, Moon, Sparkles } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 glass-morphism border-b border-white/20">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center animate-glow">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                SolarAI-X
              </h1>
              <p className="text-sm text-gray-600/80 backdrop-blur-sm">
                太阳能电池智能预测与分析平台 • 下一代材料设计
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* 状态指示器 */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">系统在线</span>
            </div>
            
            {/* 主题切换按钮 */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="relative p-3 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-all duration-300 group"
            >
              <div className="relative w-5 h-5">
                {theme === "dark" ? (
                  <Sun className="h-5 w-5 text-yellow-500 group-hover:rotate-90 transition-transform duration-300" />
                ) : (
                  <Moon className="h-5 w-5 text-indigo-600 group-hover:-rotate-12 transition-transform duration-300" />
                )}
              </div>
              
              {/* 工具提示 */}
              <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <div className="bg-gray-900 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap">
                  {theme === "dark" ? "切换到浅色模式" : "切换到深色模式"}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-gray-900"></div>
                </div>
              </div>
            </button>

            {/* 用户头像 */}
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">AI</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
} 