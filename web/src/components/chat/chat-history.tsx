"use client";

import { Button } from "@/components/ui/button";
import { PlusIcon, MessageCircleIcon, XIcon } from "lucide-react";
import { Conversation } from "@/lib/api";
import { cn } from "@/lib/utils";
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";

interface ChatHistoryProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  className?: string;
}

export function ChatHistory({ 
  conversations, 
  activeConversationId, 
  onSelectConversation, 
  onNewConversation,
  className 
}: ChatHistoryProps) {
  const [open, setOpen] = useState(false);

  // 格式化日期显示
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 渲染对话列表项
  const renderConversationItem = (conversation: Conversation) => (
    <button
      key={conversation.id}
      onClick={() => {
        onSelectConversation(conversation.id);
        setOpen(false);
      }}
      className={cn(
        "flex flex-col items-start w-full p-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
        activeConversationId === conversation.id && "bg-gray-100 dark:bg-gray-800"
      )}
    >
      <div className="flex items-center w-full">
        <MessageCircleIcon className="h-4 w-4 mr-2 flex-shrink-0" />
        <span className="font-medium text-sm truncate flex-1">{conversation.title}</span>
        <span className="text-xs text-gray-500">{formatDate(conversation.created_at)}</span>
      </div>
      {conversation.messages.length > 1 && (
        <p className="text-xs text-gray-500 truncate w-full mt-1 pl-6">
          {conversation.messages[conversation.messages.length - 2].content.substring(0, 50)}
          {conversation.messages[conversation.messages.length - 2].content.length > 50 ? '...' : ''}
        </p>
      )}
    </button>
  );

  return (
    <>
      {/* 移动端抽屉 */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden">
            <MessageCircleIcon className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] p-0">
          <SheetHeader className="p-4 border-b border-gray-200 dark:border-gray-800">
            <SheetTitle>聊天历史</SheetTitle>
          </SheetHeader>
          <div className="p-4">
            <Button 
              variant="default" 
              className="w-full mb-4" 
              onClick={() => {
                onNewConversation();
                setOpen(false);
              }}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              新对话
            </Button>
            <div className="space-y-1">
              {conversations.map(renderConversationItem)}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* 桌面端侧边栏 */}
      <div className={cn("hidden md:flex flex-col w-64 p-4 border-r border-gray-200 dark:border-gray-800 h-full", className)}>
        <Button 
          variant="default" 
          className="w-full mb-4" 
          onClick={onNewConversation}
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          新对话
        </Button>
        <div className="space-y-1 overflow-y-auto flex-1">
          {conversations.map(renderConversationItem)}
        </div>
      </div>
    </>
  );
} 