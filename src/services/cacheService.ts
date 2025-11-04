/**
 * Caching service to prevent redundant API calls and improve performance
 * Provides in-memory caching with TTL and LRU eviction
 */

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheOptions {
  maxSize?: number;
  defaultTtl?: number; // in milliseconds
  enableStats?: boolean;
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  currentSize: number;
  hitRate: number;
}

export class CacheService<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    currentSize: 0,
    hitRate: 0
  };

  protected options: CacheOptions;

  constructor(options: CacheOptions = {}) {
    this.options = {
      maxSize: 500,
      defaultTtl: 5 * 60 * 1000, // 5 minutes
      enableStats: true,
      ...options
    };
  }

  /**
   * Get value from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.updateStats('miss');
      return null;
    }

    // Check if expired
    const now = Date.now();
    if (now - entry.timestamp > (this.options.defaultTtl || 0)) {
      this.cache.delete(key);
      this.updateStats('miss');
      return null;
    }

    // Update access info
    entry.accessCount++;
    entry.lastAccessed = now;
    
    this.updateStats('hit');
    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    
    // Check if we need to evict (only if adding a new key)
    if (!this.cache.has(key) && this.cache.size >= (this.options.maxSize || 500)) {
      this.evictLRU();
    }

    this.cache.set(key, {
      value,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now
    });

    this.stats.currentSize = this.cache.size;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete specific key
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    this.stats.currentSize = this.cache.size;
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.stats.currentSize = 0;
  }

  /**
   * Get or set with async function
   */
  async getOrSet(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    this.set(key, value, ttl);
    return value;
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Number.MAX_SAFE_INTEGER;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  /**
   * Update cache statistics
   */
  private updateStats(type: 'hit' | 'miss'): void {
    if (!this.options.enableStats) return;

    if (type === 'hit') {
      this.stats.hits++;
    } else {
      this.stats.misses++;
    }

    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): number {
    const now = Date.now();
    const ttl = this.options.defaultTtl || 0;
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    this.stats.currentSize = this.cache.size;
    return cleaned;
  }

  /**
   * Get cache keys for debugging
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }
}

/**
 * Specialized CSS cache for Figma nodes
 */
export class CSSCache extends CacheService<string> {
  private static instance: CSSCache;

  constructor() {
    super({
      maxSize: 1000,
      defaultTtl: 10 * 60 * 1000, // 10 minutes for CSS data
      enableStats: true
    });
  }

  static getInstance(): CSSCache {
    if (!CSSCache.instance) {
      CSSCache.instance = new CSSCache();
    }
    return CSSCache.instance;
  }

  /**
   * Generate cache key for a node's CSS
   */
  static generateKey(nodeId: string, nodeType: string, hashCode?: string): string {
    return `css-${nodeType}-${nodeId}${hashCode ? `-${hashCode}` : ''}`;
  }

  /**
   * Cache CSS for a node
   */
  cacheNodeCSS(nodeId: string, nodeType: string, css: string): void {
    const key = CSSCache.generateKey(nodeId, nodeType);
    this.set(key, css);
  }

  /**
   * Get cached CSS for a node
   */
  getNodeCSS(nodeId: string, nodeType: string): string | null {
    const key = CSSCache.generateKey(nodeId, nodeType);
    return this.get(key);
  }

  /**
   * Check if node CSS is cached
   */
  hasNodeCSS(nodeId: string, nodeType: string): boolean {
    const key = CSSCache.generateKey(nodeId, nodeType);
    return this.has(key);
  }

  /**
   * Clear CSS cache for specific node
   */
  clearNodeCSS(nodeId: string, nodeType: string): void {
    const key = CSSCache.generateKey(nodeId, nodeType);
    this.delete(key);
  }

  /**
   * Get cache efficiency report
   */
  getEfficiencyReport(): {
    stats: CacheStats;
    recommendations: string[];
  } {
    const stats = this.getStats();
    const recommendations: string[] = [];

    if (stats.hitRate < 0.5) {
      recommendations.push('Low hit rate - consider increasing cache TTL');
    }

    if (stats.evictions > stats.hits * 0.1) {
      recommendations.push('High eviction rate - consider increasing cache size');
    }

    if (stats.currentSize < (this.options.maxSize || 0) * 0.3) {
      recommendations.push('Cache underutilized - consider reducing cache size');
    }

    return { stats, recommendations };
  }
}

/**
 * Performance monitoring cache
 */
export class PerformanceCache extends CacheService<number> {
  private static instance: PerformanceCache;

  constructor() {
    super({
      maxSize: 200,
      defaultTtl: 60 * 60 * 1000, // 1 hour for performance metrics
      enableStats: false
    });
  }

  static getInstance(): PerformanceCache {
    if (!PerformanceCache.instance) {
      PerformanceCache.instance = new PerformanceCache();
    }
    return PerformanceCache.instance;
  }

  /**
   * Cache operation duration
   */
  cacheDuration(operation: string, duration: number): void {
    const key = `perf-${operation}-${Date.now()}`;
    this.set(key, duration);
  }

  /**
   * Get average duration for operation
   */
  getAverageDuration(operation: string): number {
    const pattern = `perf-${operation}-`;
    const durations: number[] = [];

    for (const key of this.keys()) {
      if (key.startsWith(pattern)) {
        const duration = this.get(key);
        if (duration !== null) {
          durations.push(duration);
        }
      }
    }

    return durations.length > 0 
      ? durations.reduce((a, b) => a + b, 0) / durations.length 
      : 0;
  }
}

export default CacheService;