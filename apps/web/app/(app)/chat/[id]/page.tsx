'use client';

/**
 * Chat Detail Page
 * 
 * Shows messages for a specific chat and allows sending new messages.
 */

import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { usePageWidgets } from '@/contexts/page-context';
import { Button, Textarea } from '@whalli/ui';
import { Send, Loader2, User, Bot, Sparkles, Edit2, Trash2 } from 'lucide-react';
import type { Message, Chat } from '@whalli/utils';

export default function ChatDetailPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params?.id as string;
  
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState('');
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

  // Handle chat actions
  const handleRename = async () => {
    if (!newTitle.trim() || !chatId) return;
    try {
      await api.updateChat(chatId, { title: newTitle });
      setChat(prev => prev ? { ...prev, title: newTitle } : null);
      setRenaming(false);
      setNewTitle('');
    } catch (error) {
      console.error('Failed to rename chat:', error);
    }
  };

  const handleDelete = async () => {
    if (!chatId || !confirm('Are you sure you want to delete this chat?')) return;
    try {
      await api.deleteChat(chatId);
      router.push('/chat');
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  };

  // Context sidebar widgets with chat-specific info
  const widgets = useMemo(() => [
    {
      id: 'chat-model',
      title: 'Current Model',
      content: (
        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span className="font-medium">{chat?.model || 'Loading...'}</span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            AI model for this conversation
          </p>
        </div>
      ),
    },
    {
      id: 'chat-actions',
      title: 'Actions',
      content: (
        <div className="space-y-2">
          {renaming ? (
            <div className="space-y-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="New chat title"
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm"
                autoFocus
              />
              <div className="flex gap-2">
                <Button onClick={handleRename} size="sm" className="flex-1">
                  Save
                </Button>
                <Button
                  onClick={() => {
                    setRenaming(false);
                    setNewTitle('');
                  }}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Button
                onClick={() => {
                  setRenaming(true);
                  setNewTitle(chat?.title || '');
                }}
                variant="outline"
                className="w-full justify-start"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Rename Chat
              </Button>
              <Button
                onClick={handleDelete}
                variant="outline"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Chat
              </Button>
            </>
          )}
        </div>
      ),
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [chat, renaming, newTitle]);
  
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
              {message.role === 'USER' ? (
                <div className="flex-1 max-w-3xl text-right">
                  <div className="inline-block p-4 rounded-2xl bg-blue-600 text-white">
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                  <p className="text-xs text-zinc-600 mt-2">
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              ) : (
                <div className="flex-1">
                  <p className="whitespace-pre-wrap text-zinc-100">{message.content}</p>
                  <p className="text-xs text-zinc-600 mt-2">
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
        
        {sending && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
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
