"use client";

import { ChatInterface } from "@/components/chat/ChatInterface";

interface ChatPageProps {
  params: {
    id: string;
  };
}

export default function ChatPage({ params }: ChatPageProps) {
  return (
    <div className="h-[calc(100vh-4rem)]">
      <ChatInterface documentId={params.id} />
    </div>
  );
} 