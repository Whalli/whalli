'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { SlashCommandAutocomplete } from './SlashCommandAutocomplete';
import { VoiceRecorder } from './VoiceRecorder';
import { FileUpload } from './FileUpload';
import { useSlashCommands } from '@/hooks/useSlashCommands';
import { ChevronDown } from 'lucide-react';

export interface ChatModel {
  id: string;
  name: string;
  company: string;
  description?: string;
}

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isDisabled: boolean;
  apiUrl: string;
  models?: ChatModel[];
  selectedModel?: ChatModel | null;
  onSelectModel?: (model: ChatModel) => void;
}

export function ChatInput({ 
  onSendMessage, 
  isDisabled, 
  apiUrl,
  models = [],
  selectedModel = null,
  onSelectModel
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    showAutocomplete,
    filteredCommands,
    selectedIndex,
    handleInputChange,
    handleKeyDown: handleAutocompleteKeyDown,
    selectCommand,
    closeAutocomplete,
  } = useSlashCommands(input, setInput);

  const handleSend = () => {
    if (!input.trim() || isDisabled) return;

    onSendMessage(input.trim());
    setInput('');
    setAttachedFiles([]);
    closeAutocomplete();

    // Reset input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Handle autocomplete navigation
    if (showAutocomplete && handleAutocompleteKeyDown(e as any)) {
      return;
    }

    // Send on Enter
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    handleInputChange(value);
  };

  const handleFileSelect = (files: File[]) => {
    setAttachedFiles((prev) => [...prev, ...files]);
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVoiceRecorded = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      // Upload audio file
      const formData = new FormData();
      formData.append('file', audioBlob, 'voice-message.webm');
      formData.append('type', 'audio');

      const response = await fetch(`${apiUrl}/files/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      
      // Add transcription placeholder
      setInput((prev) => `${prev}\n[Voice message: ${data.filename}]`);
    } catch (error) {
      console.error('Voice upload failed:', error);
      alert('Failed to upload voice message');
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className="border-t border-border bg-background">
      <div className="max-w-3xl mx-auto p-4">
        {/* Attached Files */}
        {attachedFiles.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-2 py-1 bg-muted rounded-lg text-xs"
              >
                <span className="text-foreground">{file.name}</span>
                <button
                  onClick={() => handleRemoveFile(index)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Transcribing Status */}
        {isTranscribing && (
          <div className="mb-2 px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg text-xs text-primary">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Transcribing audio...</span>
            </div>
          </div>
        )}

        {/* Input Area - Design fidèle à l'image */}
        <div className="relative">
          {/* Slash Command Autocomplete */}
          {showAutocomplete && (
            <SlashCommandAutocomplete
              commands={filteredCommands}
              selectedIndex={selectedIndex}
              onSelect={(command) => {
                selectCommand(command);
                inputRef.current?.focus();
              }}
            />
          )}

          {/* Input Box - Layout horizontal comme sur l'image */}
          <div className="flex items-center gap-2 bg-card/50 rounded-full border border-border px-4 py-2.5 focus-within:border-primary/50 transition-colors">
            {/* Bouton "+" pour pièces jointes à gauche */}
            <FileUpload onFileSelect={handleFileSelect} disabled={isDisabled} />

            {/* Input au centre */}
            <input
              ref={inputRef}
              value={input}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="What do you want to know"
              disabled={isDisabled}
              className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder-muted-foreground disabled:text-muted-foreground"
            />

            {/* Model Selector à droite - Style comme sur l'image */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="relative">
                <button
                  onClick={() => setShowModelSelector(!showModelSelector)}
                  className="flex items-center gap-1.5 text-xs font-medium text-foreground hover:opacity-80 transition-opacity"
                  disabled={isDisabled || models.length === 0}
                >
                  <div className="w-4 h-4 rounded-full bg-foreground flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-background" fill="currentColor" viewBox="0 0 20 20">
                      <circle cx="10" cy="10" r="10" />
                    </svg>
                  </div>
                  {selectedModel ? (
                    <span>{selectedModel.name}</span>
                  ) : (
                    <span>Select model</span>
                  )}
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
                        {models.map((model) => (
                          <button
                            key={model.id}
                            onClick={() => {
                              onSelectModel?.(model);
                              setShowModelSelector(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition ${
                              selectedModel?.id === model.id ? 'bg-primary/10' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm font-medium text-foreground">{model.name}</div>
                                <div className="text-xs text-muted-foreground">{model.company}</div>
                              </div>
                              {selectedModel?.id === model.id && (
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

              {/* Bouton dynamique : Voice (input vide) ou Send (avec texte) */}
              <VoiceRecorder
                onRecordingComplete={handleVoiceRecorded}
                disabled={isDisabled || isTranscribing}
                compact={true}
                showSendButton={!!input.trim()}
                onSend={handleSend}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
