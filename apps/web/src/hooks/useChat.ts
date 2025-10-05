import { useState, useCallback, useEffect, useRef } from 'react';
import { Message } from '@/components/chat/ChatUI';

export interface UseChatOptions {
  userId: string;
  chatId?: string;
  modelId?: string;
  apiUrl: string;
}

export interface ChatSession {
  sessionId: string;
  chatId?: string;
}

/**
 * Custom hook for chat functionality with SSE streaming support
 * 
 * Features:
 * - Fetches conversation history on mount
 * - Sends messages to NestJS backend
 * - Receives streaming responses via Server-Sent Events
 * - Handles real-time token updates
 * - Persists messages in local state
 */
export function useChat({ userId, chatId, modelId, apiUrl }: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const currentSessionRef = useRef<ChatSession | null>(null);
  const streamingMessageIdRef = useRef<string | null>(null);

  /**
   * Fetch conversation history on mount
   */
  useEffect(() => {
    if (!chatId) {
      setIsLoading(false);
      return;
    }

    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`${apiUrl}/api/chat/history?chatId=${chatId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch history: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Transform API messages to UI format
        const historyMessages: Message[] = (data.messages || []).map((msg: any) => ({
          id: msg.id || `msg-${Date.now()}-${Math.random()}`,
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
          timestamp: new Date(msg.createdAt || msg.timestamp || Date.now()),
          isStreaming: false,
        }));

        setMessages(historyMessages);
      } catch (err) {
        console.error('Failed to fetch chat history:', err);
        setError(err instanceof Error ? err.message : 'Failed to load chat history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [chatId, apiUrl]);

  /**
   * Cleanup EventSource on unmount
   */
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  /**
   * Send message and handle SSE streaming
   */
  const sendMessage = useCallback(
    async (content: string) => {
      if (!modelId) {
        console.warn('No model selected');
        return;
      }

      if (isStreaming) {
        console.warn('Already streaming a response');
        return;
      }

      // Close any existing EventSource
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      // Add user message immediately
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsStreaming(true);
      setError(null);

      try {
        // Step 1: Start chat session (POST /api/chat/start)
        const startResponse = await fetch(`${apiUrl}/api/chat/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            prompt: content,
            modelId,
            userId,
            chatId: chatId || undefined,
            projectId: undefined, // Optional: pass if chat is linked to a project
            taskId: undefined,    // Optional: pass if chat is linked to a task
          }),
        });

        if (!startResponse.ok) {
          throw new Error(`Failed to start chat: ${startResponse.statusText}`);
        }

        const { sessionId, chatId: newChatId } = await startResponse.json();
        
        currentSessionRef.current = { sessionId, chatId: newChatId || chatId };

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

        // Step 3: Open EventSource for streaming (GET /api/chat/stream?sessionId=xxx)
        const eventSource = new EventSource(
          `${apiUrl}/api/chat/stream?sessionId=${sessionId}`,
          { withCredentials: true }
        );

        eventSourceRef.current = eventSource;

        // Handle incoming tokens
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'token') {
              // Append token to streaming message
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: msg.content + data.content }
                    : msg
                )
              );
            } else if (data.type === 'done') {
              // Stream completed
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
              currentSessionRef.current = null;
            } else if (data.type === 'error') {
              // Handle error from server
              throw new Error(data.message || 'Stream error');
            }
          } catch (err) {
            console.error('Error parsing SSE data:', err);
          }
        };

        // Handle connection errors
        eventSource.onerror = (err) => {
          console.error('EventSource error:', err);
          
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { 
                    ...msg, 
                    content: msg.content || 'Sorry, I encountered an error while streaming the response.',
                    isStreaming: false 
                  }
                : msg
            )
          );

          setIsStreaming(false);
          setError('Connection lost while streaming. Please try again.');
          
          eventSource.close();
          eventSourceRef.current = null;
          streamingMessageIdRef.current = null;
          currentSessionRef.current = null;
        };

      } catch (err) {
        console.error('Failed to send message:', err);
        
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: err instanceof Error ? err.message : 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, errorMessage]);
        setError(err instanceof Error ? err.message : 'Failed to send message');
        setIsStreaming(false);

        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
        
        streamingMessageIdRef.current = null;
        currentSessionRef.current = null;
      }
    },
    [userId, chatId, modelId, apiUrl, isStreaming]
  );

  /**
   * Stop streaming manually
   */
  const stopStreaming = useCallback(() => {
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
    currentSessionRef.current = null;
  }, []);

  /**
   * Clear all messages
   */
  const clearMessages = useCallback(() => {
    stopStreaming();
    setMessages([]);
    setError(null);
  }, [stopStreaming]);

  return {
    messages,
    sendMessage,
    stopStreaming,
    clearMessages,
    isStreaming,
    isLoading,
    error,
    currentSession: currentSessionRef.current,
  };
}
