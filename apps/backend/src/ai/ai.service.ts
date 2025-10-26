import {
  Injectable,
  BadRequestException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiCompletionRequest {
  model: string;
  messages: AiMessage[];
  systemInstruction?: string;
}

export interface AiCompletionResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private openai: OpenAI | null = null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      this.logger.log('OpenAI client initialized');
    } else {
      this.logger.warn('OPENAI_API_KEY not found - AI service will use mock responses');
    }
  }

  /**
   * Generate AI reply (provider-agnostic interface)
   * 
   * @param model - AI model identifier (e.g., 'gpt-4o', 'claude-3-opus')
   * @param systemInstruction - Optional system instruction/prompt
   * @param messages - Conversation history
   * @returns AI-generated reply
   */
  async generateReply(
    model: string,
    systemInstruction?: string,
    messages: Array<{ role: string; content: string }> = [],
  ): Promise<string> {
    // Validate model
    if (!model) {
      throw new BadRequestException('Model is required');
    }

    // Build messages array with system instruction
    const fullMessages: Array<{ role: string; content: string }> = [];
    
    if (systemInstruction) {
      fullMessages.push({
        role: 'system',
        content: systemInstruction,
      });
    }
    
    fullMessages.push(...messages);

    // Route to appropriate provider based on model
    if (this.isOpenAIModel(model)) {
      return this.generateOpenAIReply(model, fullMessages);
    }

    // For non-OpenAI models, return mock response for now
    this.logger.warn(`Model ${model} not yet implemented, using mock response`);
    return this.generateMockResponse(messages[messages.length - 1]?.content || '', model);
  }

  /**
   * Generate completion using the interface from chat.service.ts
   */
  async generateCompletion(
    request: AiCompletionRequest,
  ): Promise<AiCompletionResponse> {
    const { model, messages, systemInstruction } = request;

    const content = await this.generateReply(
      model,
      systemInstruction,
      messages as Array<{ role: string; content: string }>,
    );

    return {
      content,
      model,
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
    };
  }

  /**
   * Generate reply using OpenAI API
   */
  private async generateOpenAIReply(
    model: string,
    messages: Array<{ role: string; content: string }>,
  ): Promise<string> {
    if (!this.openai) {
      this.logger.warn('OpenAI client not initialized, using mock response');
      return this.generateMockResponse(
        messages[messages.length - 1]?.content || '',
        model,
      );
    }

    try {
      this.logger.log(`Generating OpenAI completion with model: ${model}`);

      const completion = await this.openai.chat.completions.create({
        model: this.mapToOpenAIModel(model),
        messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
        temperature: 0.7,
        max_tokens: 4096,
      });

      const reply = completion.choices[0]?.message?.content;

      if (!reply) {
        throw new ServiceUnavailableException('No response from AI provider');
      }

      this.logger.log(`OpenAI completion successful. Tokens: ${completion.usage?.total_tokens || 0}`);

      return reply;
    } catch (error) {
      this.logger.error('OpenAI API error:', error);
      
      if (error instanceof OpenAI.APIError) {
        if (error.status === 401) {
          throw new ServiceUnavailableException('Invalid API key');
        }
        if (error.status === 429) {
          throw new ServiceUnavailableException('Rate limit exceeded');
        }
        throw new ServiceUnavailableException(`OpenAI API error: ${error.message}`);
      }
      
      throw new ServiceUnavailableException('Failed to generate AI response');
    }
  }

  /**
   * Mock AI response for development/testing
   */
  private generateMockResponse(userMessage: string, model: string): string {
    const responses = [
      `I understand you said: "${userMessage}". As an AI assistant powered by ${model}, I'm here to help you with any questions or tasks.`,
      `Thank you for your message. I'm currently in development mode, but I can see you're asking about: "${userMessage}". How can I assist you further?`,
      `Interesting question! While I'm processing using ${model}, I can help you explore this topic further. What specific aspect would you like to know more about?`,
      `That's a great question about "${userMessage}"! Let me help you with that. As ${model}, I can provide detailed insights on this topic.`,
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Check if model is an OpenAI model
   */
  private isOpenAIModel(model: string): boolean {
    return model.startsWith('gpt-');
  }

  /**
   * Map our model IDs to OpenAI model IDs
   */
  private mapToOpenAIModel(model: string): string {
    const modelMap: Record<string, string> = {
      'gpt-4o': 'gpt-4o',
      'gpt-4-turbo': 'gpt-4-turbo-preview',
      'gpt-4': 'gpt-4',
      'gpt-3.5-turbo': 'gpt-3.5-turbo',
    };

    return modelMap[model] || model;
  }

  /**
   * Validate AI model
   */
  isValidModel(model: string): boolean {
    const validModels = [
      'gpt-4o',
      'gpt-4',
      'gpt-4-turbo',
      'gpt-3.5-turbo',
      'claude-3-opus',
      'claude-3-sonnet',
      'claude-3-haiku',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
    ];

    return validModels.includes(model);
  }
}
