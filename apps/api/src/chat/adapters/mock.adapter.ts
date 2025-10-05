import { Injectable, Logger } from '@nestjs/common';
import { ModelAdapter } from './model-adapter.interface';

/**
 * MockAdapter - Test adapter for ChatService
 * 
 * Implements ModelAdapter interface with predictable responses for testing.
 * Returns tokens ["Hello", " ", "World"] with configurable delay.
 * 
 * Usage in tests:
 * ```typescript
 * const moduleFixture = await Test.createTestingModule({
 *   providers: [
 *     ChatService,
 *     { provide: OpenAIAdapter, useClass: MockAdapter },
 *     { provide: AnthropicAdapter, useClass: MockAdapter },
 *     { provide: XAIAdapter, useClass: MockAdapter },
 *   ],
 * }).compile();
 * ```
 */
@Injectable()
export class MockAdapter implements ModelAdapter {
  private readonly logger = new Logger(MockAdapter.name);
  
  // Configurable mock responses
  private mockResponses: Map<string, string[]> = new Map();
  
  // Default tokens
  private defaultTokens: string[] = ['Hello', ' ', 'World'];
  
  // Configurable delay between tokens (ms)
  private tokenDelay: number = 10;

  constructor() {
    this.logger.log('MockAdapter initialized for testing');
  }

  /**
   * Set custom mock response for specific prompt
   * Useful for testing different scenarios
   * 
   * @example
   * mockAdapter.setMockResponse('test prompt', ['Custom', ' ', 'response']);
   */
  setMockResponse(prompt: string, tokens: string[]): void {
    this.mockResponses.set(prompt, tokens);
  }

  /**
   * Set delay between token emissions
   * @param delayMs - Delay in milliseconds (0 = no delay, instant)
   */
  setTokenDelay(delayMs: number): void {
    this.tokenDelay = delayMs;
  }

  /**
   * Clear all custom mock responses
   */
  clearMockResponses(): void {
    this.mockResponses.clear();
  }

  /**
   * Stream chat completion with mock tokens
   * 
   * Flow:
   * 1. Check for custom response for this prompt
   * 2. If found, use custom tokens
   * 3. Otherwise, use default tokens ["Hello", " ", "World"]
   * 4. Yield each token with delay
   * 
   * @param modelId - Model ID (logged but not used in mock)
   * @param prompt - User prompt (used to lookup custom responses)
   * @returns AsyncGenerator yielding mock tokens
   */
  async *streamChatCompletion(
    modelId: string,
    prompt: string,
  ): AsyncGenerator<string, void, unknown> {
    this.logger.debug(
      `MockAdapter streaming for model: ${modelId}, prompt: "${prompt.substring(0, 50)}..."`,
    );

    // Get tokens for this prompt (custom or default)
    const tokens = this.mockResponses.get(prompt) || this.defaultTokens;

    // Stream tokens with delay
    for (const token of tokens) {
      yield token;
      
      // Add delay between tokens to simulate real streaming
      if (this.tokenDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, this.tokenDelay));
      }
    }

    this.logger.debug(
      `MockAdapter finished streaming ${tokens.length} tokens`,
    );
  }

  /**
   * Mock adapters are always configured (no API keys needed)
   * @returns Always true for mock adapter
   */
  isConfigured(): boolean {
    return true;
  }

  /**
   * Get available mock models
   * Returns a list of fake model IDs for testing
   */
  getAvailableModels(): string[] {
    return [
      'mock-gpt-4',
      'mock-gpt-3.5-turbo',
      'mock-claude-3-opus',
      'mock-test-model',
    ];
  }

  /**
   * Get current default tokens
   * Useful for verifying test setup
   */
  getDefaultTokens(): string[] {
    return [...this.defaultTokens];
  }

  /**
   * Set new default tokens
   * Changes the default response for all prompts without custom responses
   */
  setDefaultTokens(tokens: string[]): void {
    this.defaultTokens = tokens;
  }
}
