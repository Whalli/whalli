import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ChatCacheService } from './chat-cache.service';

describe('ChatCacheService', () => {
  let service: ChatCacheService;
  let configService: ConfigService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatCacheService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, any> = {
                REDIS_HOST: 'localhost',
                REDIS_PORT: 6379,
                REDIS_PASSWORD: undefined,
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<ChatCacheService>(ChatCacheService);
    configService = module.get<ConfigService>(ConfigService);

    // Initialize Redis connection
    await service.onModuleInit();
  });

  afterAll(async () => {
    // Clean up and disconnect
    await service.clearAllCache();
    await service.onModuleDestroy();
  });

  beforeEach(async () => {
    // Clear cache before each test
    await service.clearAllCache();
  });

  describe('Cache Operations', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should return null for cache miss', async () => {
      const modelId = 'gpt-4-turbo';
      const prompt = 'What is the capital of France?';

      const cached = await service.getCachedResponse(modelId, prompt);
      expect(cached).toBeNull();
    });

    it('should cache and retrieve response', async () => {
      const modelId = 'gpt-4-turbo';
      const prompt = 'What is the capital of France?';
      const response = 'The capital of France is Paris.';

      // Initial cache miss
      let cached = await service.getCachedResponse(modelId, prompt);
      expect(cached).toBeNull();

      // Set cache
      await service.setCachedResponse(modelId, prompt, response);

      // Cache hit
      cached = await service.getCachedResponse(modelId, prompt);
      expect(cached).toBe(response);
    });

    it('should generate consistent cache keys', () => {
      const modelId = 'gpt-4';
      const prompt = 'Hello, world!';

      const key1 = service['generateCacheKey'](modelId, prompt);
      const key2 = service['generateCacheKey'](modelId, prompt);

      expect(key1).toBe(key2);
      expect(key1).toContain('chat:cache:');
      expect(key1.length).toBe(76); // 'chat:cache:' (12) + SHA-256 hex (64)
    });

    it('should generate different keys for different inputs', () => {
      const key1 = service['generateCacheKey']('gpt-4', 'Hello');
      const key2 = service['generateCacheKey']('gpt-4', 'World');
      const key3 = service['generateCacheKey']('claude-3-opus', 'Hello');

      expect(key1).not.toBe(key2); // Different prompts
      expect(key1).not.toBe(key3); // Different models
      expect(key2).not.toBe(key3); // Both different
    });

    it('should invalidate specific cache entry', async () => {
      const modelId = 'gpt-4';
      const prompt = 'Test prompt';
      const response = 'Test response';

      // Cache the response
      await service.setCachedResponse(modelId, prompt, response);
      let cached = await service.getCachedResponse(modelId, prompt);
      expect(cached).toBe(response);

      // Invalidate
      await service.invalidateCache(modelId, prompt);
      cached = await service.getCachedResponse(modelId, prompt);
      expect(cached).toBeNull();
    });

    it('should clear all cache entries', async () => {
      // Cache multiple responses
      await service.setCachedResponse('gpt-4', 'Prompt 1', 'Response 1');
      await service.setCachedResponse('gpt-4', 'Prompt 2', 'Response 2');
      await service.setCachedResponse('claude-3-opus', 'Prompt 3', 'Response 3');

      // Verify cached
      let stats = await service.getCacheStats();
      expect(stats.totalKeys).toBe(3);

      // Clear all
      await service.clearAllCache();

      // Verify cleared
      stats = await service.getCacheStats();
      expect(stats.totalKeys).toBe(0);
    });
  });

  describe('Cache Statistics', () => {
    it('should return cache stats', async () => {
      await service.setCachedResponse('gpt-4', 'Test 1', 'Response 1');
      await service.setCachedResponse('gpt-4', 'Test 2', 'Response 2');
      await service.setCachedResponse('claude-3-opus', 'Test 3', 'Response 3');

      const stats = await service.getCacheStats();

      expect(stats).toHaveProperty('totalKeys');
      expect(stats).toHaveProperty('cachePrefix');
      expect(stats).toHaveProperty('ttl');
      expect(stats.totalKeys).toBe(3);
      expect(stats.cachePrefix).toBe('chat:cache:');
      expect(stats.ttl).toBe(3600);
    });

    it('should handle empty cache stats', async () => {
      await service.clearAllCache();

      const stats = await service.getCacheStats();

      expect(stats.totalKeys).toBe(0);
      expect(stats.cachePrefix).toBe('chat:cache:');
      expect(stats.ttl).toBe(3600);
    });
  });

  describe('Cache Key Collision', () => {
    it('should handle case-sensitive prompts', () => {
      const key1 = service['generateCacheKey']('gpt-4', 'Hello World');
      const key2 = service['generateCacheKey']('gpt-4', 'hello world');

      expect(key1).not.toBe(key2);
    });

    it('should handle whitespace differences', () => {
      const key1 = service['generateCacheKey']('gpt-4', 'Hello  World');
      const key2 = service['generateCacheKey']('gpt-4', 'Hello World');

      expect(key1).not.toBe(key2);
    });

    it('should handle special characters', () => {
      const key1 = service['generateCacheKey']('gpt-4', 'Hello! How are you?');
      const key2 = service['generateCacheKey']('gpt-4', 'Hello How are you');

      expect(key1).not.toBe(key2);
    });
  });

  describe('Error Handling', () => {
    it('should handle very long prompts', async () => {
      const modelId = 'gpt-4';
      const longPrompt = 'A'.repeat(10000); // 10K characters
      const response = 'Response to long prompt';

      await service.setCachedResponse(modelId, longPrompt, response);
      const cached = await service.getCachedResponse(modelId, longPrompt);

      expect(cached).toBe(response);
    });

    it('should handle very long responses', async () => {
      const modelId = 'gpt-4';
      const prompt = 'Generate a long response';
      const longResponse = 'B'.repeat(50000); // 50K characters

      await service.setCachedResponse(modelId, prompt, longResponse);
      const cached = await service.getCachedResponse(modelId, prompt);

      expect(cached).toBe(longResponse);
    });

    it('should handle empty prompts', async () => {
      const modelId = 'gpt-4';
      const emptyPrompt = '';
      const response = 'Response to empty prompt';

      await service.setCachedResponse(modelId, emptyPrompt, response);
      const cached = await service.getCachedResponse(modelId, emptyPrompt);

      expect(cached).toBe(response);
    });

    it('should handle unicode characters', async () => {
      const modelId = 'gpt-4';
      const unicodePrompt = '你好世界 🌍 Привет мир';
      const response = 'Unicode response: 안녕하세요 😊';

      await service.setCachedResponse(modelId, unicodePrompt, response);
      const cached = await service.getCachedResponse(modelId, unicodePrompt);

      expect(cached).toBe(response);
    });
  });

  describe('TTL Behavior', () => {
    it('should have correct TTL configuration', async () => {
      const stats = await service.getCacheStats();
      expect(stats.ttl).toBe(3600); // 1 hour
    });

    // Note: This test would require waiting 1 hour or mocking Redis TTL
    // For now, we just verify the TTL is set correctly in stats
  });

  describe('Integration Scenarios', () => {
    it('should handle multiple models with same prompt', async () => {
      const prompt = 'What is AI?';
      const response1 = 'AI is artificial intelligence (OpenAI response)';
      const response2 = 'AI is artificial intelligence (Anthropic response)';

      await service.setCachedResponse('gpt-4', prompt, response1);
      await service.setCachedResponse('claude-3-opus', prompt, response2);

      const cached1 = await service.getCachedResponse('gpt-4', prompt);
      const cached2 = await service.getCachedResponse('claude-3-opus', prompt);

      expect(cached1).toBe(response1);
      expect(cached2).toBe(response2);
      expect(cached1).not.toBe(cached2);
    });

    it('should handle same model with different prompts', async () => {
      const modelId = 'gpt-4';
      const prompt1 = 'What is AI?';
      const prompt2 = 'What is ML?';
      const response1 = 'AI response';
      const response2 = 'ML response';

      await service.setCachedResponse(modelId, prompt1, response1);
      await service.setCachedResponse(modelId, prompt2, response2);

      const cached1 = await service.getCachedResponse(modelId, prompt1);
      const cached2 = await service.getCachedResponse(modelId, prompt2);

      expect(cached1).toBe(response1);
      expect(cached2).toBe(response2);
    });

    it('should maintain cache independence', async () => {
      // Cache entry A
      await service.setCachedResponse('gpt-4', 'Prompt A', 'Response A');

      // Cache entry B
      await service.setCachedResponse('gpt-4', 'Prompt B', 'Response B');

      // Invalidate A
      await service.invalidateCache('gpt-4', 'Prompt A');

      // B should still be cached
      const cachedA = await service.getCachedResponse('gpt-4', 'Prompt A');
      const cachedB = await service.getCachedResponse('gpt-4', 'Prompt B');

      expect(cachedA).toBeNull();
      expect(cachedB).toBe('Response B');
    });
  });
});
