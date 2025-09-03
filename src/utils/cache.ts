/**
 * Caching utility for Better MyCourses API
 *
 * Features:
 * - In-memory caching with TTL support
 * - Automatic cleanup of expired entries
 * - Session-based cache keys for user isolation
 * - Cache invalidation on user logout
 * - HTTP cache headers for client-side caching
 *
 * Cache TTL Strategy:
 * - User Profile: 15 minutes (LONG)
 * - Courses: 1 hour (VERY_LONG) - courses don't change frequently
 * - Attendance: 5 minutes (MEDIUM) - can change during classes
 * - Session Validation: 5 minutes (MEDIUM)
 */

interface CacheItem<T = unknown> {
  data: T;
  expiry: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

class MemoryCache {
  private cache = new Map<string, CacheItem<unknown>>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired items every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000,
    );
  }

  set(key: string, value: unknown, ttl: number = 300): void {
    const expiry = Date.now() + ttl * 1000;
    this.cache.set(key, { data: value, expiry });
  }

  get(key: string): unknown | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

// Cache instance
const memoryCache = new MemoryCache();

// Cache utility functions
export const cache = {
  // Get from cache
  get: (key: string, options: CacheOptions = {}): unknown | null => {
    const { prefix = "mycourses" } = options;
    const cacheKey = `${prefix}:${key}`;
    return memoryCache.get(cacheKey);
  },

  // Set cache with TTL
  set: (key: string, value: unknown, options: CacheOptions = {}): void => {
    const { ttl = 300, prefix = "mycourses" } = options; // Default 5 minutes
    const cacheKey = `${prefix}:${key}`;
    memoryCache.set(cacheKey, value, ttl);
  },

  // Delete from cache
  delete: (key: string, options: CacheOptions = {}): void => {
    const { prefix = "mycourses" } = options;
    const cacheKey = `${prefix}:${key}`;
    memoryCache.delete(cacheKey);
  },

  // Check if key exists
  has: (key: string, options: CacheOptions = {}): boolean => {
    const { prefix = "mycourses" } = options;
    const cacheKey = `${prefix}:${key}`;
    return memoryCache.has(cacheKey);
  },

  // Clear all cache
  clear: (): void => {
    memoryCache.clear();
  },

  // Helper for session-based cache keys
  sessionKey: (moodleSession: string, suffix: string): string => {
    // Use first 8 chars of session for key (enough to be unique but not too long)
    const sessionHash = moodleSession.substring(0, 8);
    return `session:${sessionHash}:${suffix}`;
  },

  // Helper for user-based cache keys
  userKey: (moodleSession: string, suffix: string): string => {
    const sessionHash = moodleSession.substring(0, 8);
    return `user:${sessionHash}:${suffix}`;
  },

  // Helper for course-based cache keys
  courseKey: (
    moodleSession: string,
    courseId: string,
    suffix: string,
  ): string => {
    const sessionHash = moodleSession.substring(0, 8);
    return `course:${sessionHash}:${courseId}:${suffix}`;
  },

  // Minimal cache wrapper with ETag support
  withCache: async <T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = CACHE_TTL.MEDIUM,
  ): Promise<{ data: T; etag: string; cached: boolean }> => {
    const cached = cache.get(key) as T | null;
    if (cached) {
      const etag = `"${btoa(JSON.stringify(cached)).slice(0, 16)}"`;
      return { data: cached, etag, cached: true };
    }

    const data = await fetchFn();
    cache.set(key, data, { ttl });
    const etag = `"${btoa(JSON.stringify(data)).slice(0, 16)}"`;

    return { data, etag, cached: false };
  },

  // Clear user cache
  clearUser: (moodleSession: string): void => {
    const sessionHash = moodleSession.substring(0, 8);
    cache.delete(`user:${sessionHash}:profile`);
    cache.delete(`user:${sessionHash}:courses`);
    cache.delete(`session:${sessionHash}:validation`);
  },
};

// Cache TTL constants
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 900, // 15 minutes
  VERY_LONG: 3600, // 1 hour
} as const;

// Cleanup on process exit
process.on("exit", () => {
  memoryCache.destroy();
});

export default cache;
