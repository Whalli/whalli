'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * Simple Chat Component - Direct SSE Integration Example
 * 
 * This is a minimal example showing how to connect to the NestJS SSE backend.
 * For production use, see ChatUI.tsx and useChat.ts
 */

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface SimpleChatExampleProps {
  userId: string;
  chatId?: string;
  modelId?: string;
  apiUrl?: string;
}

export function SimpleChatExample({
  userId,
  chatId,
  modelId = 'gpt-4-turbo',
  apiUrl = 'http://localhost:3001',
}: SimpleChatExampleProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const streamingMessageIdRef = useRef<string | null>(null);

  /**
   * 1. Fetch conversation history on mount
   */
  useEffect(() => {
    if (!chatId) return;

    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${apiUrl}/api/chat/history?chatId=${chatId}`, {
          credentials: 'include',
        });

        if (!response.ok) throw new Error('Failed to fetch history');

        const data = await response.json();
        const historyMessages: Message[] = (data.messages || []).map((msg: any) => ({
          id: msg.id,
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
          timestamp: new Date(msg.createdAt),
          isStreaming: false,
        }));

        setMessages(historyMessages);
      } catch (err) {
        console.error('Failed to load history:', err);
        setError('Failed to load conversation history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [chatId, apiUrl]);

  /**
   * 2. Send message and handle SSE streaming
   */
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isStreaming) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsStreaming(true);
    setError(null);

    try {
      // Step 1: POST /chat/start to create session
      const startResponse = await fetch(`${apiUrl}/api/chat/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          prompt: userMessage.content,
          modelId,
          userId,
          chatId,
        }),
      });

      if (!startResponse.ok) {
        throw new Error('Failed to start chat session');
      }

      const { sessionId } = await startResponse.json();

      // Step 2: Create placeholder assistant message
      const assistantMessageId = `assistant-${Date.now()}`;
      streamingMessageIdRef.current = assistantMessageId;

      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Step 3: Open EventSource for SSE streaming
      const eventSource = new EventSource(
        `${apiUrl}/api/chat/stream?sessionId=${sessionId}`,
        { withCredentials: true }
      );

      eventSourceRef.current = eventSource;

      // Step 4: Handle incoming events
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'token') {
          // Append token to assistant message
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: msg.content + data.content }
                : msg
            )
          );
        } else if (data.type === 'done') {
          // Stream complete - mark message as done
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, isStreaming: false }
                : msg
            )
          );

          setIsStreaming(false);
          eventSource.close();
          eventSourceRef.current = null;
          streamingMessageIdRef.current = null;
        } else if (data.type === 'error') {
          throw new Error(data.message || 'Stream error');
        }
      };

      // Step 5: Handle connection errors
      eventSource.onerror = () => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: msg.content || 'Connection lost.',
                  isStreaming: false,
                }
              : msg
          )
        );

        setIsStreaming(false);
        setError('Connection error. Please try again.');
        eventSource.close();
        eventSourceRef.current = null;
        streamingMessageIdRef.current = null;
      };
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
      setIsStreaming(false);

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    }
  };

  /**
   * Stop streaming manually
   */
  const handleStopStreaming = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (streamingMessageIdRef.current) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === streamingMessageIdRef.current
            ? { ...msg, isStreaming: false }
            : msg
        )
      );
      streamingMessageIdRef.current = null;
    }

    setIsStreaming(false);
  };

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Simple Chat Example</h1>
        <p className="text-sm text-gray-600">
          Direct SSE integration with NestJS backend
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
          <p className="text-sm text-red-700">⚠️ {error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading conversation...</p>
          </div>
        </div>
      )}

      {/* Messages List */}
      {!isLoading && (
        <div className="flex-1 overflow-y-auto mb-4 space-y-4 border rounded-lg p-4 bg-gray-50">
          {messages.length === 0 && (
            <p className="text-center text-gray-500">No messages yet. Start chatting!</p>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                {message.isStreaming && (
                  <div className="mt-2 flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.1s' }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    ></div>
                  </div>
                )}
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="flex-shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type your message..."
            disabled={isStreaming}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isStreaming}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>

        {/* Stop Streaming Button */}
        {isStreaming && (
          <button
            onClick={handleStopStreaming}
            className="w-full mt-2 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Stop Generating
          </button>
        )}

        {/* Info */}
        <p className="text-xs text-gray-500 mt-2 text-center">
          Model: {modelId} • Backend: {apiUrl}
        </p>
      </div>
    </div>
  );
}
