"use client";

import { ChatUI } from '@/components/chat';

export default function ChatPage({ params }: { params: { chatId: string } }) {
  const _chatId = params.chatId as string;
  
  // In a real app, get userId from auth context
  const userId = 'demo-user-id';

  // TODO: Fetch chat history for this chatId from API
  // TODO: Pass chatId to ChatUI once API integration is ready

  return (
    <div className="h-full">
      <ChatUI 
        userId={userId} 
        apiUrl="http://localhost:3001"
      />
    </div>
  );
}
