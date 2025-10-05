import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';
import { createHash } from 'crypto';

/**
 * ChatCacheService - Redis-based caching for chat responses
 * 
 * Features:
 * - Caches identical requests (same model + prompt)
 * - TTL of 1 hour for cached responses
 * - Automatic cache key generation via SHA-256 hash
 * - Handles streaming by storing complete responses
 */
@Injectable()
export class ChatCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ChatCacheService.name);
  private redisClient: RedisClientType;
  private readonly CACHE_TTL = 3600; // 1 hour in seconds
  private readonly CACHE_PREFIX = 'chat:cache:';

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.redisClient = createClient({
      socket: {
        host: this.configService.get<string>('REDIS_HOST') || 'localhost',
        port: this.configService.get<number>('REDIS_PORT') || 6379,
      },
      password: this.configService.get<string>('REDIS_PASSWORD'),
    });

    this.redisClient.on('error', (err) => {
      this.logger.error('Redis Client Error', err);
    });

    this.redisClient.on('connect', () => {
      this.logger.log('Redis client connected for chat cache');
    });

    await this.redisClient.connect();
    this.logger.log('ChatCacheService initialized');
  }

  async onModuleDestroy() {
    if (this.redisClient) {
      await this.redisClient.quit();
      this.logger.log('Redis client disconnected');
    }
  }

  /**
   * Generate cache key from model ID and prompt
   * Uses SHA-256 hash to create consistent, collision-resistant keys
   */
  private generateCacheKey(modelId: string, prompt: string): string {
    const hash = createHash('sha256')
      .update(`${modelId}:${prompt}`)
      .digest('hex');
    return `${this.CACHE_PREFIX}${hash}`;
  }

  /**
   * Check if a response is cached for the given model + prompt
   * Returns cached response if found, null otherwise
   */
  async getCachedResponse(modelId: string, prompt: string): Promise<string | null> {
    try {
      const cacheKey = this.generateCacheKey(modelId, prompt);
      const cached = await this.redisClient.get(cacheKey);

      if (cached) {
        this.logger.log(`Cache HIT for model ${modelId} (key: ${cacheKey.substring(0, 40)}...)`);
        return cached;
      }

      this.logger.log(`Cache MISS for model ${modelId} (key: ${cacheKey.substring(0, 40)}...)`);
      return null;
    } catch (error) {
      this.logger.error('Error getting cached response:', error);
      return null; // Fail gracefully - don't block the request
    }
  }

  /**
   * Store a response in cache with TTL
   */
  async setCachedResponse(modelId: string, prompt: string, response: string): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(modelId, prompt);
      await this.redisClient.setEx(cacheKey, this.CACHE_TTL, response);
      
      this.logger.log(
        `Cached response for model ${modelId} (key: ${cacheKey.substring(0, 40)}..., ` +
        `size: ${response.length} chars, TTL: ${this.CACHE_TTL}s)`
      );
    } catch (error) {
      this.logger.error('Error setting cached response:', error);
      // Don't throw - caching is not critical
    }
  }

  /**
   * Invalidate cache for specific model + prompt
   */
  async invalidateCache(modelId: string, prompt: string): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(modelId, prompt);
      await this.redisClient.del(cacheKey);
      this.logger.log(`Invalidated cache for key: ${cacheKey.substring(0, 40)}...`);
    } catch (error) {
      this.logger.error('Error invalidating cache:', error);
    }
  }

  /**
   * Clear all chat cache entries
   * WARNING: This deletes ALL cached responses
   */
  async clearAllCache(): Promise<void> {
    try {
      const keys = await this.redisClient.keys(`${this.CACHE_PREFIX}*`);
      if (keys.length > 0) {
        await this.redisClient.del(keys);
        this.logger.log(`Cleared ${keys.length} cached responses`);
      } else {
        this.logger.log('No cached responses to clear');
      }
    } catch (error) {
      this.logger.error('Error clearing cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalKeys: number;
    cachePrefix: string;
    ttl: number;
  }> {
    try {
      const keys = await this.redisClient.keys(`${this.CACHE_PREFIX}*`);
      return {
        totalKeys: keys.length,
        cachePrefix: this.CACHE_PREFIX,
        ttl: this.CACHE_TTL,
      };
    } catch (error) {
      this.logger.error('Error getting cache stats:', error);
      return {
        totalKeys: 0,
        cachePrefix: this.CACHE_PREFIX,
        ttl: this.CACHE_TTL,
      };
    }
  }
}
