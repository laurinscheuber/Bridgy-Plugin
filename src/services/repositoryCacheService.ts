/**
 * Repository Cache Service
 * Provides intelligent caching for repository lists to improve performance
 */

import { GitProject } from "../types/git";
import { LoggingService } from "../config";

interface CacheEntry {
  repositories: GitProject[];
  timestamp: number;
  provider: string;
  tokenHash: string; // Hash of token to detect token changes
}

interface CacheMetadata {
  lastCleanup: number;
  hitCount: number;
  missCount: number;
}

export class RepositoryCacheService {
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private static readonly MAX_CACHE_SIZE = 10; // Max different token/provider combinations
  private static readonly CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 minutes
  
  private static cache: Map<string, CacheEntry> = new Map();
  private static metadata: CacheMetadata = {
    lastCleanup: Date.now(),
    hitCount: 0,
    missCount: 0
  };

  /**
   * Generate cache key from provider and token
   */
  private static generateCacheKey(provider: string, token: string): string {
    // Simple hash function for token (don't store actual token)
    const tokenHash = this.simpleHash(token);
    return `${provider}:${tokenHash}`;
  }

  /**
   * Simple hash function for security
   */
  private static simpleHash(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get repositories from cache if available and fresh
   */
  static getCachedRepositories(provider: string, token: string): GitProject[] | null {
    this.performPeriodicCleanup();
    
    const cacheKey = this.generateCacheKey(provider, token);
    const entry = this.cache.get(cacheKey);
    
    if (!entry) {
      this.metadata.missCount++;
      LoggingService.debug(`Cache miss for ${provider}`, { cacheKey }, LoggingService.CATEGORIES.GITHUB);
      return null;
    }

    const age = Date.now() - entry.timestamp;
    if (age > this.CACHE_DURATION) {
      // Cache expired
      this.cache.delete(cacheKey);
      this.metadata.missCount++;
      LoggingService.debug(`Cache expired for ${provider}`, { age, maxAge: this.CACHE_DURATION }, LoggingService.CATEGORIES.GITHUB);
      return null;
    }

    this.metadata.hitCount++;
    LoggingService.debug(`Cache hit for ${provider}`, { 
      repositoryCount: entry.repositories.length,
      age 
    }, LoggingService.CATEGORIES.GITHUB);
    
    return [...entry.repositories]; // Return copy to prevent mutation
  }

  /**
   * Store repositories in cache
   */
  static cacheRepositories(provider: string, token: string, repositories: GitProject[]): void {
    this.performPeriodicCleanup();
    
    const cacheKey = this.generateCacheKey(provider, token);
    const tokenHash = this.simpleHash(token);
    
    const entry: CacheEntry = {
      repositories: [...repositories], // Store copy to prevent mutation
      timestamp: Date.now(),
      provider,
      tokenHash
    };

    this.cache.set(cacheKey, entry);
    
    // Limit cache size
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      this.evictOldestEntry();
    }

    LoggingService.debug(`Cached repositories for ${provider}`, { 
      repositoryCount: repositories.length,
      cacheSize: this.cache.size 
    }, LoggingService.CATEGORIES.GITHUB);
  }

  /**
   * Invalidate cache for specific provider/token combination
   */
  static invalidateCache(provider: string, token: string): void {
    const cacheKey = this.generateCacheKey(provider, token);
    const deleted = this.cache.delete(cacheKey);
    
    if (deleted) {
      LoggingService.debug(`Invalidated cache for ${provider}`, { cacheKey }, LoggingService.CATEGORIES.GITHUB);
    }
  }

  /**
   * Clear all cache entries
   */
  static clearCache(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.metadata.hitCount = 0;
    this.metadata.missCount = 0;
    
    LoggingService.info(`Cleared repository cache`, { previousSize: size }, LoggingService.CATEGORIES.GITHUB);
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): {
    size: number;
    hitRate: number;
    entries: Array<{
      provider: string;
      repositoryCount: number;
      age: number;
      fresh: boolean;
    }>;
  } {
    const totalRequests = this.metadata.hitCount + this.metadata.missCount;
    const hitRate = totalRequests > 0 ? this.metadata.hitCount / totalRequests : 0;

    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      provider: entry.provider,
      repositoryCount: entry.repositories.length,
      age: Date.now() - entry.timestamp,
      fresh: (Date.now() - entry.timestamp) < this.CACHE_DURATION
    }));

    return {
      size: this.cache.size,
      hitRate: Math.round(hitRate * 100) / 100,
      entries
    };
  }

  /**
   * Perform periodic cleanup of expired entries
   */
  private static performPeriodicCleanup(): void {
    const now = Date.now();
    const timeSinceLastCleanup = now - this.metadata.lastCleanup;
    
    if (timeSinceLastCleanup < this.CLEANUP_INTERVAL) {
      return;
    }

    const sizeBefore = this.cache.size;
    let removedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      if (age > this.CACHE_DURATION) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    this.metadata.lastCleanup = now;
    
    if (removedCount > 0) {
      LoggingService.debug(`Cleaned up expired cache entries`, { 
        removed: removedCount,
        before: sizeBefore,
        after: this.cache.size 
      }, LoggingService.CATEGORIES.GITHUB);
    }
  }

  /**
   * Evict oldest cache entry when cache is full
   */
  private static evictOldestEntry(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      LoggingService.debug(`Evicted oldest cache entry`, { 
        key: oldestKey,
        age: Date.now() - oldestTime 
      }, LoggingService.CATEGORIES.GITHUB);
    }
  }

  /**
   * Preload repositories in background (for proactive caching)
   */
  static async preloadRepositories(
    provider: string, 
    token: string, 
    fetchFunction: () => Promise<GitProject[]>
  ): Promise<GitProject[]> {
    // Check cache first
    const cached = this.getCachedRepositories(provider, token);
    if (cached) {
      // Return cached immediately, but trigger background refresh if older than 2 minutes
      const cacheKey = this.generateCacheKey(provider, token);
      const entry = this.cache.get(cacheKey);
      const age = Date.now() - (entry?.timestamp || 0);
      
      if (age > 2 * 60 * 1000) { // 2 minutes
        // Background refresh (don't await)
        fetchFunction().then(fresh => {
          this.cacheRepositories(provider, token, fresh);
        }).catch(error => {
          LoggingService.warn(`Background repository refresh failed`, error, LoggingService.CATEGORIES.GITHUB);
        });
      }
      
      return cached;
    }

    // Fetch fresh data
    try {
      const repositories = await fetchFunction();
      this.cacheRepositories(provider, token, repositories);
      return repositories;
    } catch (error) {
      LoggingService.error(`Failed to preload repositories`, error, LoggingService.CATEGORIES.GITHUB);
      throw error;
    }
  }
}