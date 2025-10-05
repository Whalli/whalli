import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModelAdapter } from './model-adapter.interface';

/**
 * OpenAI Adapter - Handles communication with OpenAI API
 * This is a stub implementation - replace with actual OpenAI SDK integration
 */
@Injectable()
export class OpenAIAdapter implements ModelAdapter {
  private readonly logger = new Logger(OpenAIAdapter.name);
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>(process.env.OPENAI_API_KEY) || '';
  }

  /**
   * Stream chat completion from OpenAI
   * @param modelId - The OpenAI model ID (e.g., 'gpt-4-turbo', 'gpt-3.5-turbo')
   * @param prompt - The user's message/prompt
   * @returns AsyncGenerator yielding text chunks
   */
  async *streamChatCompletion(
    modelId: string,
    prompt: string,
  ): AsyncGenerator<string, void, unknown> {
    this.logger.log(`Streaming from OpenAI model: ${modelId}`);

    // TODO: Replace with actual OpenAI SDK integration
    // Example with OpenAI SDK:
    // const openai = new OpenAI({ apiKey: this.apiKey });
    // const stream = await openai.chat.completions.create({
    //   model: modelId,
    //   messages: [{ role: 'user', content: prompt }],
    //   stream: true,
    // });
    // for await (const chunk of stream) {
    //   const content = chunk.choices[0]?.delta?.content || '';
    //   if (content) {
    //     yield content;
    //   }
    // }

    // STUB IMPLEMENTATION - Simulates streaming response
    const mockResponse = `This is a mock response from ${modelId} to your prompt: "${prompt}". 

To integrate with the real OpenAI API:
1. Install the OpenAI SDK: pnpm add openai
2. Set OPENAI_API_KEY in your .env file
3. Uncomment the actual implementation above
4. Remove this stub implementation

The response would normally be streamed token by token from the AI model.`;

    // Simulate streaming by yielding chunks
    const words = mockResponse.split(' ');
    for (const word of words) {
      yield word + ' ';
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  /**
   * Check if the adapter is properly configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Get available OpenAI models
   */
  getAvailableModels(): string[] {
    return [
      'gpt-4-turbo',
      'gpt-4',
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-16k',
    ];
  }
}
