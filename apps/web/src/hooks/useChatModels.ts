import { useState, useEffect } from 'react';

export interface AIModel {
  id: string;
  name: string;
  company: string;
  description?: string;
}

export function useChatModels(apiUrl: string) {
  const [models, setModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setIsLoading(true);
        
        // Fetch models from API
        const response = await fetch(`${apiUrl}/api/model-catalog/models`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch models: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Transform API response to AIModel format
        const fetchedModels: AIModel[] = (data.models || []).map((model: any) => ({
          id: model.id || model.modelId,
          name: model.name || model.displayName,
          company: model.provider || model.company,
          description: model.description,
        }));

        setModels(fetchedModels);
        
        // Auto-select first model if available
        if (fetchedModels.length > 0 && !selectedModel) {
          setSelectedModel(fetchedModels[0]);
        }

        // Fallback to mock data if API returns empty
        if (fetchedModels.length === 0) {
          console.warn('No models returned from API, using fallback models');
          const fallbackModels: AIModel[] = [
            {
              id: 'gpt-4-turbo',
              name: 'GPT-4 Turbo',
              company: 'OpenAI',
              description: 'Most capable model, great for complex tasks',
            },
            {
              id: 'gpt-3.5-turbo',
              name: 'GPT-3.5 Turbo',
              company: 'OpenAI',
              description: 'Fast and efficient for most tasks',
            },
            {
              id: 'claude-3-opus',
              name: 'Claude 3 Opus',
              company: 'Anthropic',
              description: 'Most powerful Claude model',
            },
          ];
          setModels(fallbackModels);
          if (fallbackModels.length > 0 && !selectedModel) {
            setSelectedModel(fallbackModels[0]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch models:', error);
        
        // Use fallback models on error
        const fallbackModels: AIModel[] = [
          {
            id: 'gpt-4-turbo',
            name: 'GPT-4 Turbo',
            company: 'OpenAI',
            description: 'Most capable model, great for complex tasks',
          },
          {
            id: 'gpt-3.5-turbo',
            name: 'GPT-3.5 Turbo',
            company: 'OpenAI',
            description: 'Fast and efficient for most tasks',
          },
          {
            id: 'claude-3-opus',
            name: 'Claude 3 Opus',
            company: 'Anthropic',
            description: 'Most powerful Claude model',
          },
        ];
        setModels(fallbackModels);
        if (fallbackModels.length > 0 && !selectedModel) {
          setSelectedModel(fallbackModels[0]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchModels();
  }, [apiUrl]);

  return {
    models,
    selectedModel,
    setSelectedModel,
    isLoading,
  };
}
