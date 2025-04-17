"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

export default function ChatPage() {
  // 预设模型列表
  const models = [
    { label: "deepseek-chat", value: "deepseek-chat" },
    { label: "solar-llm", value: "solar-llm" },
    { label: "gpt-3.5-turbo", value: "gpt-3.5-turbo" },
  ];
  const [model, setModel] = useState(models[0].value);

  return (
    <div className="flex h-[calc(100vh-32px)] min-h-[600px] bg-gradient-to-br from-gray-50 to-slate-100 rounded-xl shadow-lg overflow-hidden m-4">
      {/* 左侧会话列表 */}
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <Button className="w-full" variant="outline">+ 新建会话</Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {/* 会话列表（后续动态渲染） */}
          <div className="mb-2 p-2 rounded cursor-pointer hover:bg-slate-100 font-medium text-primary">会话 1</div>
          <div className="mb-2 p-2 rounded cursor-pointer hover:bg-slate-100">会话 2</div>
        </div>
      </aside>
      {/* 右侧对话区 */}
      <main className="flex-1 flex flex-col">
        {/* 顶部模型选择 */}
        <div className="flex items-center justify-between p-4 border-b bg-white">
          <div className="text-lg font-bold">智能对话</div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">模型：</span>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="选择模型" />
              </SelectTrigger>
              <SelectContent>
                {models.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {/* 对话内容区 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
          {/* 聊天气泡示例 */}
          <div className="flex">
            <div className="bg-primary text-white rounded-lg px-4 py-2 max-w-xl ml-auto">你好！请问有什么可以帮您？</div>
          </div>
          <div className="flex">
            <div className="bg-white border rounded-lg px-4 py-2 max-w-xl mr-auto">请介绍一下 solarllm。</div>
          </div>
        </div>
        {/* 底部输入区 */}
        <form className="flex items-center gap-2 p-4 border-t bg-white">
          <Input className="flex-1" placeholder="请输入消息..." />
          <Button type="submit">发送</Button>
        </form>
      </main>
    </div>
  );
} 