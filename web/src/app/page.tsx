import { ChatContainer } from '@/components/chat/chat-container';
import { Toaster } from '@/components/ui/sonner';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Toaster position="top-right" />
      <ChatContainer />
    </main>
  );
}
