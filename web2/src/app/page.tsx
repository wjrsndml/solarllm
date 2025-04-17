import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-200 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center mb-10">
        <h1 className="text-4xl font-bold mb-4 text-primary">solarllm 智能前端</h1>
        <p className="text-lg text-muted-foreground mb-2">基于 Next.js + Shadcn/UI 重构，体验更美观、交互更流畅。</p>
        <p className="text-base text-gray-500">请选择功能入口：</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
        <Link href="/chat">
          <Card className="hover:shadow-lg transition cursor-pointer">
            <CardHeader>
              <CardTitle>💬 智能对话</CardTitle>
            </CardHeader>
            <CardContent>
              支持多轮对话、历史记录、模型切换，体验 AI 聊天。
            </CardContent>
          </Card>
        </Link>
        <Link href="/solar">
          <Card className="hover:shadow-lg transition cursor-pointer">
            <CardHeader>
              <CardTitle>🔆 太阳能参数预测</CardTitle>
            </CardHeader>
            <CardContent>
              输入参数，一键预测太阳能相关性能。
            </CardContent>
          </Card>
        </Link>
        <Link href="/aging">
          <Card className="hover:shadow-lg transition cursor-pointer">
            <CardHeader>
              <CardTitle>📈 老化曲线预测</CardTitle>
            </CardHeader>
            <CardContent>
              预测并可视化老化过程曲线，辅助科研分析。
            </CardContent>
          </Card>
        </Link>
        <Link href="/perovskite">
          <Card className="hover:shadow-lg transition cursor-pointer">
            <CardHeader>
              <CardTitle>🧪 钙钛矿相关预测</CardTitle>
            </CardHeader>
            <CardContent>
              钙钛矿材料相关参数与性能预测。
            </CardContent>
          </Card>
        </Link>
        <Link href="/image">
          <Card className="hover:shadow-lg transition cursor-pointer">
            <CardHeader>
              <CardTitle>🖼️ 图片处理与展示</CardTitle>
            </CardHeader>
            <CardContent>
              支持图片上传、处理与智能展示。
            </CardContent>
          </Card>
        </Link>
      </div>
    </main>
  );
}
