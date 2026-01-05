/**
 * Tests for CacheService and CSSCache
 * Validates caching functionality and performance optimizations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CacheService, CSSCache } from '../../src/services/cacheService';

describe('CacheService', () => {
  let cache: CacheService<string>;

  beforeEach(() => {
    cache = new CacheService<string>({
      maxSize: 5,
      defaultTtl: 1000, // 1 second for testing
      enableStats: true,
    });
  });

  describe('basic operations', () => {
    it('should store and retrieve values', () => {
      cache.set('key1', 'value1');

      expect(cache.get('key1')).toBe('value1');
      expect(cache.has('key1')).toBe(true);
      expect(cache.size()).toBe(1);
    });

    it('should return null for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeNull();
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should delete values', () => {
      cache.set('key1', 'value1');
      expect(cache.delete('key1')).toBe(true);
      expect(cache.get('key1')).toBeNull();
      expect(cache.size()).toBe(0);
    });

    it('should clear all values', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      cache.clear();

      expect(cache.size()).toBe(0);
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should expire values after TTL', async () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');

      // Wait for TTL to expire
      await new Promise((resolve) => setTimeout(resolve, 1100));

      expect(cache.get('key1')).toBeNull();
    });

    it('should update access time on get', () => {
      cache.set('key1', 'value1');

      // Access the value multiple times
      cache.get('key1');
      cache.get('key1');

      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
    });
  });

  describe('LRU eviction', () => {
    it('should evict least recently used items when max size reached', () => {
      // Fill cache to max size
      for (let i = 0; i < 5; i++) {
        cache.set(`key${i}`, `value${i}`);
      }

      expect(cache.size()).toBe(5);

      // Access key1 to make it recently used
      cache.get('key1');

      // Add one more item, should evict key0 (least recently used)
      cache.set('key5', 'value5');

      expect(cache.size()).toBe(5);
      expect(cache.get('key0')).toBeNull(); // Should be evicted
      expect(cache.get('key1')).toBe('value1'); // Should still exist
      expect(cache.get('key5')).toBe('value5'); // Should exist
    });
  });

  describe('getOrSet', () => {
    it('should return cached value if exists', async () => {
      cache.set('key1', 'cached-value');

      const factory = vi.fn().mockResolvedValue('factory-value');
      const result = await cache.getOrSet('key1', factory);

      expect(result).toBe('cached-value');
      expect(factory).not.toHaveBeenCalled();
    });

    it('should call factory and cache result if not exists', async () => {
      const factory = vi.fn().mockResolvedValue('factory-value');
      const result = await cache.getOrSet('key1', factory);

      expect(result).toBe('factory-value');
      expect(factory).toHaveBeenCalledOnce();
      expect(cache.get('key1')).toBe('factory-value');
    });

    it('should handle factory errors', async () => {
      const factory = vi.fn().mockRejectedValue(new Error('Factory failed'));

      await expect(cache.getOrSet('key1', factory)).rejects.toThrow('Factory failed');
      expect(cache.get('key1')).toBeNull();
    });
  });

  describe('statistics', () => {
    it('should track hits and misses', () => {
      cache.set('key1', 'value1');

      // Hit
      cache.get('key1');
      // Miss
      cache.get('key2');

      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.5);
      expect(stats.currentSize).toBe(1);
    });

    it('should track evictions', () => {
      // Fill cache beyond max size to trigger evictions
      for (let i = 0; i < 7; i++) {
        cache.set(`key${i}`, `value${i}`);
      }

      const stats = cache.getStats();
      expect(stats.evictions).toBeGreaterThan(0);
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', async () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 1100));

      const cleaned = cache.cleanup();

      expect(cleaned).toBe(2);
      expect(cache.size()).toBe(0);
    });
  });
});

describe('CSSCache', () => {
  let cssCache: CSSCache;

  beforeEach(() => {
    cssCache = new CSSCache();
  });

  afterEach(() => {
    cssCache.clear();
  });

  describe('key generation', () => {
    it('should generate consistent keys', () => {
      const key1 = CSSCache.generateKey('node123', 'COMPONENT');
      const key2 = CSSCache.generateKey('node123', 'COMPONENT');

      expect(key1).toBe(key2);
      expect(key1).toBe('css-COMPONENT-node123');
    });

    it('should generate unique keys for different nodes', () => {
      const key1 = CSSCache.generateKey('node123', 'COMPONENT');
      const key2 = CSSCache.generateKey('node456', 'COMPONENT');

      expect(key1).not.toBe(key2);
    });

    it('should include hash code when provided', () => {
      const key = CSSCache.generateKey('node123', 'COMPONENT', 'abc123');

      expect(key).toBe('css-COMPONENT-node123-abc123');
    });
  });

  describe('CSS caching', () => {
    it('should cache and retrieve CSS for nodes', () => {
      const nodeId = 'test-node-123';
      const nodeType = 'COMPONENT';
      const css = 'color: red; font-size: 16px;';

      cssCache.cacheNodeCSS(nodeId, nodeType, css);

      expect(cssCache.hasNodeCSS(nodeId, nodeType)).toBe(true);
      expect(cssCache.getNodeCSS(nodeId, nodeType)).toBe(css);
    });

    it('should return null for non-cached nodes', () => {
      expect(cssCache.getNodeCSS('nonexistent', 'COMPONENT')).toBeNull();
      expect(cssCache.hasNodeCSS('nonexistent', 'COMPONENT')).toBe(false);
    });

    it('should clear specific node CSS', () => {
      const nodeId = 'test-node-123';
      const nodeType = 'COMPONENT';
      const css = 'color: blue;';

      cssCache.cacheNodeCSS(nodeId, nodeType, css);
      expect(cssCache.hasNodeCSS(nodeId, nodeType)).toBe(true);

      cssCache.clearNodeCSS(nodeId, nodeType);
      expect(cssCache.hasNodeCSS(nodeId, nodeType)).toBe(false);
    });
  });

  describe('efficiency reporting', () => {
    it('should provide cache efficiency report', () => {
      // Add some cache entries
      cssCache.cacheNodeCSS('node1', 'COMPONENT', 'css1');
      cssCache.cacheNodeCSS('node2', 'TEXT', 'css2');

      // Generate some hits and misses
      cssCache.getNodeCSS('node1', 'COMPONENT'); // hit
      cssCache.getNodeCSS('nonexistent', 'COMPONENT'); // miss

      const report = cssCache.getEfficiencyReport();

      expect(report.stats).toHaveProperty('hits');
      expect(report.stats).toHaveProperty('misses');
      expect(report.stats).toHaveProperty('hitRate');
      expect(report.recommendations).toBeInstanceOf(Array);
    });

    it('should provide recommendations based on usage patterns', () => {
      // Generate many misses to trigger low hit rate recommendation
      for (let i = 0; i < 10; i++) {
        cssCache.getNodeCSS(`nonexistent${i}`, 'COMPONENT');
      }

      const report = cssCache.getEfficiencyReport();

      expect(report.recommendations).toContain('Low hit rate - consider increasing cache TTL');
    });
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = CSSCache.getInstance();
      const instance2 = CSSCache.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should maintain state across getInstance calls', () => {
      const instance1 = CSSCache.getInstance();
      instance1.cacheNodeCSS('test', 'COMPONENT', 'css');

      const instance2 = CSSCache.getInstance();
      expect(instance2.getNodeCSS('test', 'COMPONENT')).toBe('css');
    });
  });
});
