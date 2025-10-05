import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from '../chat.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatCacheService } from '../chat-cache.service';
import { OpenAIAdapter } from '../adapters/openai.adapter';
import { AnthropicAdapter } from '../adapters/anthropic.adapter';
import { XAIAdapter } from '../adapters/xai.adapter';
import { MockAdapter } from '../adapters/mock.adapter';
import { ProjectsService } from '../../projects/projects.service';
import { TasksService } from '../../tasks/tasks.service';
import { MetricsService } from '../../common/metrics/metrics.service';

describe('ChatService with MockAdapter', () => {
  let service: ChatService;
  let mockAdapter: MockAdapter;

  beforeEach(async () => {
    // Create a shared MockAdapter instance
    mockAdapter = new MockAdapter();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        
        // Replace all AI adapters with MockAdapter
        { provide: OpenAIAdapter, useValue: mockAdapter },
        { provide: AnthropicAdapter, useValue: mockAdapter },
        { provide: XAIAdapter, useValue: mockAdapter },
        
        // Mock other dependencies
        {
          provide: PrismaService,
          useValue: {
            // Mock Prisma methods as needed
            user: { findUnique: jest.fn() },
            model: { findUnique: jest.fn(), findMany: jest.fn() },
            message: { create: jest.fn(), findMany: jest.fn() },
            chatSession: { create: jest.fn(), findUnique: jest.fn() },
          },
        },
        {
          provide: ChatCacheService,
          useValue: {
            getCachedResponse: jest.fn().mockResolvedValue(null),
            setCachedResponse: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: ProjectsService,
          useValue: {
            // Mock projects methods as needed
          },
        },
        {
          provide: TasksService,
          useValue: {
            // Mock tasks methods as needed
          },
        },
        {
          provide: MetricsService,
          useValue: {
            recordChatRequest: jest.fn(),
            recordCacheHit: jest.fn(),
            recordCacheMiss: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  afterEach(() => {
    // Clean up mock responses after each test
    mockAdapter.clearMockResponses();
  });

  describe('streamChatResponse with MockAdapter', () => {
    it('should stream default tokens ["Hello", " ", "World"]', async () => {
      // Arrange
      const sessionId = 'test-session-id';
      const userId = 'test-user-id';
      
      // Act
      const tokens: string[] = [];
      const generator = service.streamChatResponse(sessionId, userId);
      
      for await (const event of generator) {
        if (event.type === 'token') {
          tokens.push(event.content);
        }
      }

      // Assert
      expect(tokens).toEqual(['Hello', ' ', 'World']);
    });

    it('should stream custom tokens for specific prompt', async () => {
      // Arrange
      mockAdapter.setMockResponse('test prompt', ['Custom', ' ', 'Response']);
      
      const sessionId = 'test-session-id';
      const userId = 'test-user-id';
      
      // Act
      const tokens: string[] = [];
      const generator = service.streamChatResponse(sessionId, userId);
      
      for await (const event of generator) {
        if (event.type === 'token') {
          tokens.push(event.content);
        }
      }

      // Assert
      expect(tokens).toEqual(['Custom', ' ', 'Response']);
    });

    it('should stream with configurable delay', async () => {
      // Arrange
      mockAdapter.setTokenDelay(50); // 50ms delay between tokens
      
      const sessionId = 'test-session-id';
      const userId = 'test-user-id';
      
      const startTime = Date.now();
      
      // Act
      const tokens: string[] = [];
      const generator = service.streamChatResponse(sessionId, userId);
      
      for await (const event of generator) {
        if (event.type === 'token') {
          tokens.push(event.content);
        }
      }
      
      const elapsed = Date.now() - startTime;

      // Assert
      expect(tokens).toEqual(['Hello', ' ', 'World']);
      expect(elapsed).toBeGreaterThanOrEqual(100); // 3 tokens * 50ms = 150ms (allow some margin)
    });

    it('should stream instantly with zero delay', async () => {
      // Arrange
      mockAdapter.setTokenDelay(0); // No delay
      
      const sessionId = 'test-session-id';
      const userId = 'test-user-id';
      
      const startTime = Date.now();
      
      // Act
      const tokens: string[] = [];
      const generator = service.streamChatResponse(sessionId, userId);
      
      for await (const event of generator) {
        if (event.type === 'token') {
          tokens.push(event.content);
        }
      }
      
      const elapsed = Date.now() - startTime;

      // Assert
      expect(tokens).toEqual(['Hello', ' ', 'World']);
      expect(elapsed).toBeLessThan(50); // Should be very fast
    });

    it('should handle multiple different prompts with custom responses', async () => {
      // Arrange
      mockAdapter.setMockResponse('prompt 1', ['Response', ' ', '1']);
      mockAdapter.setMockResponse('prompt 2', ['Response', ' ', '2']);
      
      // Test first prompt
      const tokens1: string[] = [];
      const generator1 = mockAdapter.streamChatCompletion('model-id', 'prompt 1');
      for await (const token of generator1) {
        tokens1.push(token);
      }
      
      // Test second prompt
      const tokens2: string[] = [];
      const generator2 = mockAdapter.streamChatCompletion('model-id', 'prompt 2');
      for await (const token of generator2) {
        tokens2.push(token);
      }
      
      // Test unknown prompt (should use defaults)
      const tokens3: string[] = [];
      const generator3 = mockAdapter.streamChatCompletion('model-id', 'unknown prompt');
      for await (const token of generator3) {
        tokens3.push(token);
      }

      // Assert
      expect(tokens1).toEqual(['Response', ' ', '1']);
      expect(tokens2).toEqual(['Response', ' ', '2']);
      expect(tokens3).toEqual(['Hello', ' ', 'World']); // Default
    });

    it('should clear all mock responses', async () => {
      // Arrange
      mockAdapter.setMockResponse('prompt 1', ['Custom', ' ', '1']);
      mockAdapter.setMockResponse('prompt 2', ['Custom', ' ', '2']);
      
      // Act
      mockAdapter.clearMockResponses();
      
      // Test - should use default tokens now
      const tokens: string[] = [];
      const generator = mockAdapter.streamChatCompletion('model-id', 'prompt 1');
      for await (const token of generator) {
        tokens.push(token);
      }

      // Assert
      expect(tokens).toEqual(['Hello', ' ', 'World']); // Back to default
    });

    it('should change default tokens', async () => {
      // Arrange
      mockAdapter.setDefaultTokens(['New', ' ', 'Default', ' ', 'Tokens']);
      
      // Act
      const tokens: string[] = [];
      const generator = mockAdapter.streamChatCompletion('model-id', 'any prompt');
      for await (const token of generator) {
        tokens.push(token);
      }

      // Assert
      expect(tokens).toEqual(['New', ' ', 'Default', ' ', 'Tokens']);
    });
  });

  describe('MockAdapter configuration', () => {
    it('should always be configured', () => {
      expect(mockAdapter.isConfigured()).toBe(true);
    });

    it('should return mock model list', () => {
      const models = mockAdapter.getAvailableModels();
      expect(models).toContain('mock-gpt-4');
      expect(models).toContain('mock-claude-3-opus');
      expect(models.length).toBeGreaterThan(0);
    });

    it('should get current default tokens', () => {
      const defaults = mockAdapter.getDefaultTokens();
      expect(defaults).toEqual(['Hello', ' ', 'World']);
    });
  });
});
