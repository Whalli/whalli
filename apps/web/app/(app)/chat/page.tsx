'use client';

/**
 * Chat Home Page
 * 
 * Landing page for starting new conversations with AI.
 * Features centered logo, message input, file attachments, and model selection.
 */

import { useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { api } from '@/lib/api-client';
import { usePageWidgets } from '@/contexts/page-context';
import { ChatHistoryList } from '@/components/chat-history-list';
import { LogoWide } from '@/components/logo-wide';
import { 
  Send, 
  Paperclip, 
  FileText, 
  X,
  ChevronDown,
  Sparkles
} from 'lucide-react';

const AVAILABLE_MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o', description: 'Most capable model' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Fast and powerful' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Quick responses' },
];

interface Attachment {
  id: string;
  file: File;
  type: 'image' | 'document';
  preview?: string;
}

export default function ChatPage() {
  const [message, setMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0]);
  const [showModelSelect, setShowModelSelect] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Show chat history in context sidebar
  const widgets = useMemo(() => [
    {
      id: 'chat-history',
      title: 'Conversations',
      content: <ChatHistoryList />,
    },
  ], []);
  
  usePageWidgets(widgets);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    files.forEach((file) => {
      const isImage = file.type.startsWith('image/');
      const attachment: Attachment = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        type: isImage ? 'image' : 'document',
      };

      // Create preview for images
      if (isImage) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setAttachments((prev) => [
            ...prev,
            { ...attachment, preview: e.target?.result as string },
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        setAttachments((prev) => [...prev, attachment]);
      }
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSend = async () => {
    if ((!message.trim() && attachments.length === 0) || sending) return;

    setSending(true);

    try {
      // Create new chat with first message
      const newChat = await api.createChat({
        title: message.slice(0, 50) || 'New Chat',
        model: selectedModel.id,
      });

      // Send the message
      await api.sendMessage(newChat.id, { content: message });

      // Navigate to the chat
      router.push(`/chat/${newChat.id}`);
    } catch (error) {
      console.error('Failed to send message:', error);
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-4 py-12">
      <div className="w-full max-w-3xl">
        {/* Logo */}
        <div className="text-center mb-12">
          <LogoWide className="h-16 w-auto mx-auto" color="#ffffff" />
        </div>

        {/* Input Container */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">
          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div className="px-4 py-3 border-b border-zinc-800">
              <div className="flex flex-wrap gap-2">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="relative group"
                  >
                    {attachment.type === 'image' && attachment.preview ? (
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-zinc-700">
                        <Image
                          src={attachment.preview}
                          alt={attachment.file.name}
                          fill
                          className="object-cover"
                        />
                        <button
                          onClick={() => removeAttachment(attachment.id)}
                          className="absolute top-1 right-1 p-1 bg-zinc-900/80 hover:bg-red-600 rounded-full transition-colors z-10"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800 rounded-lg border border-zinc-700">
                        <FileText className="w-4 h-4 text-zinc-400" />
                        <span className="text-xs text-zinc-300 max-w-[100px] truncate">
                          {attachment.file.name}
                        </span>
                        <button
                          onClick={() => removeAttachment(attachment.id)}
                          className="p-0.5 hover:bg-red-600 rounded transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Message Input */}
          <div className="flex items-end gap-3 p-4">
            {/* Attachment Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 hover:bg-zinc-800 rounded-xl transition-colors flex-shrink-0"
              title="Ajouter des pièces jointes"
            >
              <Paperclip className="w-5 h-5 text-zinc-400" />
            </button>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Textarea */}
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Écrivez votre message... (Shift+Enter pour nouvelle ligne)"
              rows={1}
              className="flex-1 bg-transparent border-none outline-none resize-none text-zinc-100 placeholder-zinc-500 text-base py-3 max-h-[200px] overflow-y-auto"
              style={{
                minHeight: '24px',
                height: 'auto',
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${target.scrollHeight}px`;
              }}
            />

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={(!message.trim() && attachments.length === 0) || sending}
              className={`
                p-3 rounded-xl transition-all flex-shrink-0
                ${message.trim() || attachments.length > 0
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20'
                  : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                }
              `}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>

          {/* Model Selector - Bottom Left */}
          <div className="px-4 pb-3 flex justify-start border-t border-zinc-800">
            <div className="relative">
              <button
                onClick={() => setShowModelSelect(!showModelSelect)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-lg transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span className="font-medium">{selectedModel.name}</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* Model Dropdown */}
              {showModelSelect && (
                <div className="absolute bottom-full left-0 mb-2 w-72 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl z-50 overflow-hidden">
                  {AVAILABLE_MODELS.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model);
                        setShowModelSelect(false);
                      }}
                      className={`
                        w-full px-4 py-3 text-left hover:bg-zinc-700 transition-colors
                        ${selectedModel.id === model.id ? 'bg-zinc-700' : ''}
                      `}
                    >
                      <div className="font-medium text-zinc-100">{model.name}</div>
                      <div className="text-xs text-zinc-500 mt-0.5">{model.description}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Suggestion Cards */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {[
            { icon: '💡', text: 'Concept', action: 'Explique-moi la relativité générale en termes simples' },
            { icon: '✍️', text: 'Contenu', action: 'Aide-moi à écrire un email professionnel' },
            { icon: '🔍', text: 'Analyser', action: 'Comment analyser ce fichier CSV ?' },
            { icon: '🎨', text: 'Idées', action: 'Donne-moi des idées créatives pour un projet' },
          ].map((suggestion, index) => (
            <button
              key={index}
              onClick={() => setMessage(suggestion.action)}
              className="flex items-center gap-2 px-3 py-2 bg-zinc-900/50 hover:bg-zinc-800/50 border border-zinc-800 hover:border-zinc-700 rounded-lg transition-all group"
            >
              <span className="text-base">{suggestion.icon}</span>
              <span className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors">
                {suggestion.text}
              </span>
            </button>
          ))}
        </div>

        {/* Footer Info */}
        <p className="text-center text-xs text-zinc-600 mt-6">
          Whalli peut faire des erreurs. Vérifiez les informations importantes.
        </p>
      </div>
    </div>
  );
}
