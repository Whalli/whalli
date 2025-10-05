"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lightbulb, PenLine, BarChart3, BookOpen, ChevronDown } from 'lucide-react';
import { WhalliLogo } from '@/components/logo';
import { FileUpload } from '@/components/chat/FileUpload';
import { VoiceRecorder } from '@/components/chat/VoiceRecorder';

const MODELS = [
  { id: 'gpt-4', name: 'GPT-4', company: 'OpenAI' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', company: 'OpenAI' },
  { id: 'claude-3-opus', name: 'Claude 3 Opus', company: 'Anthropic' },
  { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', company: 'Anthropic' },
];

export default function ChatIndexPage() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateChat = async (initialMessage?: string) => {
    const message = initialMessage || input.trim();
    if (!message && selectedFiles.length === 0) return;

    setIsCreating(true);
    try {
      // Créer un nouveau chat
      const response = await fetch('/api/chat/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          modelId: selectedModel.id,
          files: selectedFiles.map(f => f.name), // Simplified pour l'exemple
        }),
      });

      if (response.ok) {
        const { chatId } = await response.json();
        // Rediriger vers le nouveau chat
        router.push(`/chat/${chatId}`);
      }
    } catch (error) {
      console.error('Failed to create chat:', error);
      // TODO: Afficher une erreur
    } finally {
      setIsCreating(false);
    }
  };

  const handleSend = () => {
    if (input.trim() || selectedFiles.length > 0) {
      handleCreateChat();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (files: File[]) => {
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleVoiceRecorded = async (audioBlob: Blob) => {
    // Upload audio et créer chat avec transcription
    console.log('Voice recorded:', audioBlob);
    // TODO: Implémenter l'upload audio et la transcription
  };

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen space-y-4 px-3">
      {/* Logo/Icon */}
      <div className="flex items-center justify-center animate-bounce-subtle">
        <WhalliLogo 
          color="#0801DA"
          height={64}
          className="hover:opacity-80 transition-opacity"
        />
      </div>
      
      {/* Search/Start Chat Input - Style ChatInput */}
      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-2 bg-card/50 rounded-full border border-border px-4 py-2.5">
          {/* FileUpload button */}
          <FileUpload 
            onFileSelect={handleFileSelect}
            disabled={isCreating}
          />

          {/* Input */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What do you want to know"
            className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
            disabled={isCreating}
          />

          {/* Model selector */}
          <div className="relative">
            <button
              onClick={() => setShowModelSelector(!showModelSelector)}
              className="flex items-center gap-1.5 text-xs font-medium text-foreground hover:opacity-80 transition-opacity flex-shrink-0"
              disabled={isCreating}
              title="Select AI model"
            >
              <div className="w-4 h-4 rounded-full bg-foreground flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-background" fill="currentColor" viewBox="0 0 20 20">
                  <circle cx="10" cy="10" r="10" />
                </svg>
              </div>
              <span>{selectedModel.name}</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </button>

            {/* Dropdown */}
            {showModelSelector && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowModelSelector(false)}
                />
                <div className="absolute bottom-full right-0 mb-2 w-64 bg-card rounded-xl shadow-lg border border-border z-20 max-h-96 overflow-y-auto">
                  <div className="p-2">
                    {MODELS.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => {
                          setSelectedModel(model);
                          setShowModelSelector(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition ${
                          selectedModel.id === model.id ? 'bg-primary/10' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium text-foreground">{model.name}</div>
                            <div className="text-xs text-muted-foreground">{model.company}</div>
                          </div>
                          {selectedModel.id === model.id && (
                            <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Voice/Send button dynamique */}
          <VoiceRecorder
            onRecordingComplete={handleVoiceRecorded}
            disabled={isCreating}
            compact={true}
            showSendButton={!!input.trim()}
            onSend={handleSend}
          />
        </div>

        {/* Selected files */}
        {selectedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-lg text-xs"
              >
                <span className="text-foreground">{file.name}</span>
                <button
                  onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <p className="text-sm text-muted-foreground mt-2 text-center">
          Press Enter to start a new conversation
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-2xl mt-8">
        {[
          { Icon: Lightbulb, label: 'Get Ideas', prompt: 'Help me brainstorm ideas for...', color: 'text-yellow-500' },
          { Icon: PenLine, label: 'Write', prompt: 'Help me write...', color: 'text-blue-500' },
          { Icon: BarChart3, label: 'Analyze', prompt: 'Analyze this data...', color: 'text-green-500' },
          { Icon: BookOpen, label: 'Research', prompt: 'Research about...', color: 'text-purple-500' },
        ].map((action) => {
          const IconComponent = action.Icon;
          return (
            <button
              key={action.label}
              className="flex justify-center items-center gap-2 p-3 bg-card border border-border rounded-lg hover:bg-accent hover:border-primary/50 transition-all group"
              onClick={() => handleQuickAction(action.prompt)}
              disabled={isCreating}
            >
              <IconComponent className={`size-5 ${action.color}`} strokeWidth={2} />
              <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                {action.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
