"use client";

import { useState } from 'react';
import { Lock, Unlock, ChevronDown, Check } from 'lucide-react';

export interface Model {
  id: string;
  name: string;
  company: string;
  description?: string;
}

interface ModelPinButtonProps {
  currentModel?: Model | null;
  pinnedModelId?: string | null;
  availableModels: Model[];
  onPinModel: (modelId: string | null) => void;
}

export function ModelPinButton({ 
  currentModel, 
  pinnedModelId,
  availableModels,
  onPinModel 
}: ModelPinButtonProps) {
  const [showPicker, setShowPicker] = useState(false);
  const isPinned = !!pinnedModelId;
  const pinnedModel = pinnedModelId 
    ? availableModels.find(m => m.id === pinnedModelId)
    : null;

  return (
    <div className="relative">
      {/* Main Button */}
      <button
        onClick={() => setShowPicker(!showPicker)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          isPinned
            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
        title={isPinned ? 'Model pinned for this conversation' : 'Pin a model to this conversation'}
      >
        {isPinned ? (
          <>
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline">{pinnedModel?.name || 'Pinned'}</span>
          </>
        ) : (
          <>
            <Unlock className="h-4 w-4" />
            <span className="hidden sm:inline">Pin Model</span>
          </>
        )}
        <ChevronDown className={`h-3 w-3 transition-transform ${showPicker ? 'rotate-180' : ''}`} />
      </button>

      {/* Model Picker Dropdown */}
      {showPicker && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowPicker(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 animate-in fade-in slide-in-from-top-2 duration-150 max-h-[400px] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                Pin AI Model
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Lock this conversation to a specific model
              </p>
            </div>

            {/* Current Model (if different from pinned) */}
            {currentModel && currentModel.id !== pinnedModelId && (
              <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-500 mb-1 px-2">Current Model:</div>
                <button
                  onClick={() => {
                    onPinModel(currentModel.id);
                    setShowPicker(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {currentModel.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {currentModel.company}
                    </div>
                  </div>
                  <Lock className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            )}

            {/* Unpin Option */}
            {isPinned && (
              <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    onPinModel(null);
                    setShowPicker(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                >
                  <Unlock className="h-4 w-4" />
                  <span className="text-sm font-medium">Unpin Model</span>
                </button>
              </div>
            )}

            {/* Available Models */}
            <div className="p-2">
              <div className="text-xs text-gray-500 mb-1 px-2">Available Models:</div>
              <div className="space-y-1">
                {availableModels.map((model) => {
                  const isCurrentlyPinned = model.id === pinnedModelId;
                  
                  return (
                    <button
                      key={model.id}
                      onClick={() => {
                        onPinModel(model.id);
                        setShowPicker(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isCurrentlyPinned
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex-1 text-left">
                        <div className={`text-sm font-medium ${
                          isCurrentlyPinned 
                            ? 'text-blue-700 dark:text-blue-400' 
                            : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {model.name}
                        </div>
                        <div className={`text-xs ${
                          isCurrentlyPinned
                            ? 'text-blue-600 dark:text-blue-500'
                            : 'text-gray-500'
                        }`}>
                          {model.company}
                        </div>
                      </div>
                      {isCurrentlyPinned && (
                        <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 p-3">
              <p className="text-xs text-gray-500">
                💡 Pinned models are locked for this conversation. You can switch anytime.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
