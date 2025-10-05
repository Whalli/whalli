'use client';

import { useState } from 'react';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { ModelPinButton } from './ModelPinButton';
import { CommandPalette } from './CommandPalette';
import { useChat } from '@/hooks/useChat';
import { useChatModels } from '@/hooks/useChatModels';
import { Info, Lock } from 'lucide-react';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface ChatUIProps {
  userId: string;
  chatId?: string;
  apiUrl?: string;
  initialPinnedModelId?: string;
  onModelPin?: (modelId: string | null) => void;
}

export function ChatUI({ 
  userId, 
  chatId,
  apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  initialPinnedModelId,
  onModelPin
}: ChatUIProps) {
  const { models, selectedModel, setSelectedModel, isLoading: modelsLoading } = useChatModels(apiUrl);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [pinnedModelId, setPinnedModelId] = useState<string | null>(initialPinnedModelId || null);

  // Override model selection if pinned
  const effectiveModel = pinnedModelId 
    ? models.find(m => m.id === pinnedModelId) || selectedModel
    : selectedModel;

  // Use chat hook with SSE support
  const { 
    messages, 
    sendMessage, 
    stopStreaming,
    clearMessages,
    isStreaming, 
    isLoading: chatLoading,
    error: chatError 
  } = useChat({
    userId,
    chatId,
    modelId: effectiveModel?.id,
    apiUrl,
  });

  // Handle model pinning
  const handlePinModel = (modelId: string | null) => {
    setPinnedModelId(modelId);
    onModelPin?.(modelId);
    
    // If pinning a model, switch to it
    if (modelId) {
      const model = models.find(m => m.id === modelId);
      if (model) {
        setSelectedModel(model);
      }
    }
  };

  // Handle sending messages
  const handleSendMessage = async (content: string) => {
    if (!effectiveModel) {
      console.warn('No model selected');
      return;
    }
    await sendMessage(content);
  };

  return (
    <>
      <div className="flex flex-col h-full bg-background">
        {/* Header with Model Pin */}
        <div className="flex-shrink-0 border-b border-border bg-card">
          <div className="flex items-center justify-between p-3 lg:p-4">
            {/* Left: Info */}
            <div className="flex items-center gap-3">
              {pinnedModelId ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm text-blue-700 dark:text-blue-300">
                    Model Locked
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Info className="h-4 w-4" />
                  <span className="text-sm hidden sm:inline">
                    Model changes with each message
                  </span>
                </div>
              )}
            </div>

            {/* Right: Model Pin Button */}
            <ModelPinButton
              currentModel={effectiveModel}
              pinnedModelId={pinnedModelId}
              availableModels={models}
              onPinModel={handlePinModel}
            />
          </div>
        </div>

        {/* Error Banner */}
        {chatError && (
          <div className="flex-shrink-0 px-4 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-700 dark:text-red-300">
                ⚠️ {chatError}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="text-sm text-red-600 dark:text-red-400 hover:underline"
              >
                Reload
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {chatLoading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading conversation...</p>
            </div>
          </div>
        )}

        {/* Messages Area - Fills available space */}
        {!chatLoading && (
          <div className="flex-1 overflow-hidden">
            <ChatMessages messages={messages} isStreaming={isStreaming} />
          </div>
        )}

        {/* Input - Fixed at bottom */}
        <div className="flex-shrink-0">
          <ChatInput
            onSendMessage={handleSendMessage}
            isDisabled={isStreaming || !effectiveModel || chatLoading}
            apiUrl={apiUrl}
            models={models}
            selectedModel={effectiveModel}
            onSelectModel={pinnedModelId ? undefined : setSelectedModel} // Disable model switching if pinned
          />
          
          {/* Stop Streaming Button */}
          {isStreaming && (
            <div className="px-4 py-2 border-t border-border bg-card">
              <button
                onClick={stopStreaming}
                className="w-full py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Stop Generating
              </button>
            </div>
          )}
        </div>

        {/* Pinned Model Notice */}
        {pinnedModelId && (
          <div className="flex-shrink-0 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-300 text-center">
              💡 This conversation is locked to <strong>{effectiveModel?.name}</strong>. 
              All messages will use this model.
            </p>
          </div>
        )}
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNewChat={() => {
          // Handle new chat creation
          window.location.href = '/chat';
        }}
      />
    </>
  );
}
