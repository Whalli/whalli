'use client';

/**
 * Chat Detail Page
 * 
 * Shows messages for a specific chat and allows sending new messages.
 */

import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api-client';
import { usePageWidgets } from '@/contexts/page-context';
import { ChatHistoryList } from '@/components/chat-history-list';
import { Button, Textarea } from '@whalli/ui';
import { Send, Loader2, User, Bot } from 'lucide-react';
import type { Message, Chat } from '@whalli/utils';

export default function ChatDetailPage() {
  const params = useParams();
  const chatId = params?.id as string;
  
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadChat = async () => {
    if (!chatId) return;
    try {
      const data = await api.getChat(chatId);
      setChat(data);
    } catch (error) {
      console.error('Failed to load chat:', error);
    }
  };

  const loadMessages = async () => {
    if (!chatId) return;
    try {
      const data = await api.getMessages(chatId);
      setMessages(data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (chatId) {
      loadChat();
      loadMessages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Add chat history to context sidebar
  const widgets = useMemo(() => [
    {
      id: 'chat-history',
      title: 'Conversations',
      content: <ChatHistoryList />,
    },
  ], []);
  
  usePageWidgets(widgets);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;

    const userInput = input;
    setInput('');
    setSending(true);

    try {
      const response = await api.sendMessage(chatId, { content: userInput });
      setMessages([...messages, response.userMessage, response.assistantMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      setInput(userInput); // Restore input on error
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
        <h2 className="text-lg font-semibold text-zinc-100">{chat?.title}</h2>
        <p className="text-sm text-zinc-500">{chat?.model}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <Bot className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-zinc-300 mb-2">No messages yet</h3>
            <p className="text-zinc-500">Start the conversation below</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-4 ${
                message.role === 'USER' ? 'flex-row-reverse' : ''
              }`}
            >
              {/* Avatar */}
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                ${message.role === 'USER' 
                  ? 'bg-gradient-to-br from-green-500 to-teal-600' 
                  : 'bg-gradient-to-br from-blue-500 to-purple-600'
                }
              `}>
                {message.role === 'USER' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>

              {/* Message Content */}
              <div className={`
                flex-1 max-w-3xl
                ${message.role === 'USER' ? 'text-right' : ''}
              `}>
                <div className={`
                  inline-block p-4 rounded-2xl
                  ${message.role === 'USER'
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800 text-zinc-100'
                  }
                `}>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
                <p className="text-xs text-zinc-600 mt-2">
                  {new Date(message.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        
        {sending && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 max-w-3xl">
              <div className="inline-block p-4 rounded-2xl bg-zinc-800">
                <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-6 border-t border-zinc-800 bg-zinc-900/50">
        <div className="max-w-4xl mx-auto flex gap-4">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Shift+Enter for new line)"
            className="flex-1 min-h-[60px] max-h-[200px] resize-none bg-zinc-800 border-zinc-700 text-zinc-100 placeholder-zinc-500"
            disabled={sending}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="h-[60px] px-6"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
