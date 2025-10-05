import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModelAdapter } from './model-adapter.interface';

/**
 * xAI Adapter - Handles communication with xAI Grok API
 * This is a stub implementation - replace with actual xAI SDK integration
 */
@Injectable()
export class XAIAdapter implements ModelAdapter {
  private readonly logger = new Logger(XAIAdapter.name);
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('XAI_API_KEY') || '';
  }

  /**
   * Stream chat completion from xAI Grok
   * @param modelId - The Grok model ID (e.g., 'grok-beta', 'grok-2')
   * @param prompt - The user's message/prompt
   * @returns AsyncGenerator yielding text chunks
   */
  async *streamChatCompletion(
    modelId: string,
    prompt: string,
  ): AsyncGenerator<string, void, unknown> {
    this.logger.log(`Streaming from xAI model: ${modelId}`);

    // TODO: Replace with actual xAI API integration
    // Example with xAI API (similar to OpenAI):
    // const xai = new XAI({ apiKey: this.apiKey });
    // const stream = await xai.chat.completions.create({
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
    const mockResponse = `Mock response from ${modelId} (xAI Grok) to: "${prompt}". 

Grok is known for:
- Real-time information access
- Witty and conversational responses
- Integration with X/Twitter data
- Advanced reasoning capabilities

To integrate with the real xAI API:
1. Install xAI SDK or use OpenAI-compatible endpoint
2. Set XAI_API_KEY in your .env file
3. Uncomment the actual implementation above
4. Remove this stub implementation`;

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
   * Get available xAI models
   */
  getAvailableModels(): string[] {
    return [
      'grok-beta',
      'grok-2',
    ];
  }
}
