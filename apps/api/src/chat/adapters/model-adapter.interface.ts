/**
 * ModelAdapter Interface
 * 
 * Common interface for all AI model adapters (OpenAI, Anthropic, xAI, Mock)
 * Ensures consistent API across different providers for dependency injection
 */
export interface ModelAdapter {
  /**
   * Stream chat completion token by token
   * @param modelId - The model ID (e.g., 'gpt-4', 'claude-3-opus')
   * @param prompt - The user's message/prompt
   * @returns AsyncGenerator yielding text chunks/tokens
   */
  streamChatCompletion(
    modelId: string,
    prompt: string,
  ): AsyncGenerator<string, void, unknown>;

  /**
   * Check if the adapter is properly configured
   * @returns True if API keys and configuration are valid
   */
  isConfigured(): boolean;

  /**
   * Get list of available models for this provider
   * @returns Array of model IDs supported by this adapter
   */
  getAvailableModels(): string[];
}
