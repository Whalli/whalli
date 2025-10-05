import { Injectable } from '@nestjs/common';

/**
 * MockAIAdapter - Test adapter that yields predictable token streams
 * Used in E2E tests to avoid calling real AI APIs
 */
@Injectable()
export class MockAIAdapter {
  private responses: Map<string, string> = new Map();

  /**
   * Set a mock response for a specific prompt
   */
  setMockResponse(prompt: string, response: string) {
    this.responses.set(prompt, response);
  }

  /**
   * Clear all mock responses
   */
  clearMockResponses() {
    this.responses.clear();
  }

  /**
   * Stream chat completion character by character (like real AI)
   * @param modelId - Model ID (ignored in mock)
   * @param prompt - User prompt
   * @param delay - Delay between tokens in ms (default: 10ms)
   */
  async *streamChatCompletion(
    modelId: string,
    prompt: string,
    delay: number = 10,
  ): AsyncGenerator<string> {
    // Get mock response or use default
    const response = this.responses.get(prompt) || 'Hi';

    // Stream character by character
    for (const char of response) {
      yield char;
      // Add small delay to simulate streaming
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Get complete response (non-streaming)
   */
  async getChatCompletion(modelId: string, prompt: string): Promise<string> {
    return this.responses.get(prompt) || 'Hi';
  }
}
