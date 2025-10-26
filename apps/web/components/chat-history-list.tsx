'use client';

/**
 * Chat History List
 * 
 * Displays a list of all chats in the context sidebar.
 * Used on chat pages to show conversation history.
 */

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api-client';
import { MessageSquare, Plus, Loader2, MoreVertical } from 'lucide-react';
import type { Chat } from '@whalli/utils';

export function ChatHistoryList() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const currentChatId = params?.id as string | undefined;

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      const data = await api.getChats();
      setChats(data);
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewChat = async () => {
    try {
      const newChat = await api.createChat({
        title: 'New Chat',
        model: 'gpt-4o',
      });
      router.push(`/chat/${newChat.id}`);
      // Reload chats to show the new one
      setTimeout(loadChats, 100);
    } catch (error) {
      console.error('Failed to create chat:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with New Chat Button */}
      <div className="p-4 border-b border-zinc-800">
        <button
          onClick={createNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="p-4 text-center">
            <MessageSquare className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-sm text-zinc-500">No chats yet</p>
          </div>
        ) : (
          <div className="p-2">
            {chats.map((chat) => {
              const isActive = chat.id === currentChatId;
              
              return (
                <button
                  key={chat.id}
                  onClick={() => router.push(`/chat/${chat.id}`)}
                  className={`
                    w-full p-3 rounded-lg transition-all text-left group mb-1
                    ${isActive 
                      ? 'bg-blue-600/20 border border-blue-600/50' 
                      : 'hover:bg-zinc-800 border border-transparent'
                    }
                  `}
                >
                  <div className="flex items-start gap-2">
                    <MessageSquare className={`
                      w-4 h-4 mt-0.5 flex-shrink-0
                      ${isActive ? 'text-blue-400' : 'text-zinc-500'}
                    `} />
                    
                    <div className="flex-1 min-w-0">
                      <h4 className={`
                        text-sm font-medium truncate
                        ${isActive ? 'text-blue-400' : 'text-zinc-300 group-hover:text-zinc-100'}
                      `}>
                        {chat.title}
                      </h4>
                      <p className="text-xs text-zinc-600 mt-0.5 truncate">
                        {chat.model}
                      </p>
                      <p className="text-xs text-zinc-700 mt-1">
                        {new Date(chat.updatedAt).toLocaleDateString()}
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Show menu with delete, rename, etc.
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-700 rounded transition-all"
                    >
                      <MoreVertical className="w-3 h-3 text-zinc-500" />
                    </button>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-zinc-800">
        <p className="text-xs text-zinc-600 text-center">
          {chats.length} {chats.length === 1 ? 'conversation' : 'conversations'}
        </p>
      </div>
    </div>
  );
}
