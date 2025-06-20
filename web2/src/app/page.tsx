"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import ChatTab from "@/components/tabs/ChatTab";
import SolarTab from "@/components/tabs/SolarTab";
import AgingTab from "@/components/tabs/AgingTab";
import PerovskiteTab from "@/components/tabs/PerovskiteTab";
import BandgapTab from "@/components/tabs/BandgapTab";

export type TabType = "chat" | "solar" | "aging" | "perovskite" | "bandgap";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("chat");

  const renderActiveTab = () => {
    switch (activeTab) {
      case "chat":
        return <ChatTab />;
      case "solar":
        return <SolarTab />;
      case "aging":
        return <AgingTab />;
      case "perovskite":
        return <PerovskiteTab />;
      case "bandgap":
        return <BandgapTab />;
      default:
        return <ChatTab />;
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 动态背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg%20width=%2260%22%20height=%2260%22%20viewBox=%220%200%2060%2060%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg%20fill=%22none%22%20fill-rule=%22evenodd%22%3E%3Cg%20fill=%22%23667eea%22%20fill-opacity=%220.05%22%3E%3Ccircle%20cx=%2230%22%20cy=%2230%22%20r=%224%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{animationDelay: '-2s'}}></div>
        <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{animationDelay: '-4s'}}></div>
      </div>

      {/* 内容区域 */}
      <div className="relative z-10">
        <Header />
        <div className="px-6 py-8">
          <div className="flex gap-8 min-h-[calc(100vh-140px)]">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            <main className="flex-1 glass-morphism rounded-2xl p-8 backdrop-blur-xl">
              <div className="h-full">
                {renderActiveTab()}
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
