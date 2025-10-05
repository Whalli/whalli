'use client';

import { AIModel } from '@/hooks/useChatModels';
import { Bot, Brain, Search, Bird, Wind, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface ChatSidebarProps {
  models: AIModel[];
  selectedModel: AIModel | null;
  onSelectModel: (model: AIModel) => void;
  isOpen: boolean;
  onToggle: () => void;
  isLoading: boolean;
}

const companyLogos: Record<string, LucideIcon> = {
  OpenAI: Bot,
  Anthropic: Brain,
  Google: Search,
  Meta: Bird,
  Mistral: Wind,
  Cohere: Sparkles,
};

export function ChatSidebar({
  models,
  selectedModel,
  onSelectModel,
  isOpen,
  isLoading,
}: ChatSidebarProps) {
  // Group models by company
  const modelsByCompany = models.reduce((acc, model) => {
    if (!acc[model.company]) {
      acc[model.company] = [];
    }
    acc[model.company].push(model);
    return acc;
  }, {} as Record<string, AIModel[]>);

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-20"
          onClick={() => {}}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative inset-y-0 left-0 z-30
          w-64 bg-white border-r border-gray-200
          transform transition-transform duration-200 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">AI Models</h2>
          <p className="text-xs text-gray-500 mt-1">Select a model to chat with</p>
        </div>

        {/* Models List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                  <div className="h-10 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          ) : (
            Object.entries(modelsByCompany).map(([company, companyModels]) => {
              const CompanyIcon = companyLogos[company] || Bot;
              return (
                <div key={company}>
                  {/* Company Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <CompanyIcon className="h-5 w-5 text-gray-600" strokeWidth={2} />
                    <h3 className="text-sm font-medium text-gray-700">{company}</h3>
                  </div>

                {/* Models */}
                <div className="space-y-1">
                  {companyModels.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => onSelectModel(model)}
                      className={`
                        w-full text-left px-3 py-2 rounded-lg
                        transition-colors duration-150
                        ${
                          selectedModel?.id === model.id
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'hover:bg-gray-50 text-gray-700 border border-transparent'
                        }
                      `}
                    >
                      <div className="text-sm font-medium">{model.name}</div>
                      {model.description && (
                        <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {model.description}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            {models.length} models available
          </div>
        </div>
      </aside>
    </>
  );
}
