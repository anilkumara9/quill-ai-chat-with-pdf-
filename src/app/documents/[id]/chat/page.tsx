"use client";

import { ChatInterface } from "@/components/chat/ChatInterface";

interface ChatPageProps {
  params: {
    id: string;
  };
}

export default function ChatPage({ params }: ChatPageProps) {
  return (
    <div className="flex-1 h-[calc(100vh-4rem)] w-full">
      <ChatInterface documentId={params.id} hideHeader={true} />
    </div>
  );
} 