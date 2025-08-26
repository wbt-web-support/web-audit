/**
 * Global cache utility for sharing data between pages
 * Prevents unnecessary re-fetches when switching tabs
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class GlobalCache {
  private cache = new Map<string, CacheEntry<any>>();

  /**
   * Set a value in the cache
   */
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Get a value from the cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    const age = now - entry.timestamp;

    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Check if a key exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const now = Date.now();
    const age = now - entry.timestamp;

    if (age > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a key from the cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Create a singleton instance
export const globalCache = new GlobalCache();

// Cache keys for different data types
export const CACHE_KEYS = {
  DASHBOARD_STATS: 'dashboard-stats',
  PROJECTS_LIST: 'projects-list',
  USER_PROFILE: 'user-profile',
  AUDIT_RESULTS: 'audit-results',
} as const;

// Utility functions for common cache operations
export const cacheUtils = {
  /**
   * Get dashboard stats from cache or return null
   */
  getDashboardStats: () => globalCache.get(CACHE_KEYS.DASHBOARD_STATS),

  /**
   * Set dashboard stats in cache
   */
  setDashboardStats: (stats: any) => globalCache.set(CACHE_KEYS.DASHBOARD_STATS, stats, 5 * 60 * 1000),

  /**
   * Get projects list from cache or return null
   */
  getProjectsList: () => globalCache.get(CACHE_KEYS.PROJECTS_LIST),

  /**
   * Set projects list in cache
   */
  setProjectsList: (projects: any) => globalCache.set(CACHE_KEYS.PROJECTS_LIST, projects, 2 * 60 * 1000),

  /**
   * Get user profile from cache or return null
   */
  getUserProfile: () => globalCache.get(CACHE_KEYS.USER_PROFILE),

  /**
   * Set user profile in cache
   */
  setUserProfile: (profile: any) => globalCache.set(CACHE_KEYS.USER_PROFILE, profile, 10 * 60 * 1000),

  /**
   * Invalidate all cache entries
   */
  invalidateAll: () => globalCache.clear(),

  /**
   * Invalidate specific cache entries
   */
  invalidate: (keys: string[]) => keys.forEach(key => globalCache.delete(key)),
};
