// Cache management utilities for better performance

export const CACHE_KEYS = {
  DASHBOARD_STATS: 'dashboard-stats-cache',
  SUBSCRIPTION_DATA: 'subscription-data-cache',
  USER_PROFILE: 'user-profile-cache',
  PROJECTS: 'projects-cache',
} as const;

export const CACHE_DURATIONS = {
  SHORT: 2 * 60 * 1000, // 2 minutes
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  LONG: 15 * 60 * 1000, // 15 minutes
  VERY_LONG: 60 * 60 * 1000, // 1 hour
} as const;

interface CachedData<T = any> {
  data: T;
  timestamp: number;
  version: string;
}

/**
 * Save data to localStorage with timestamp
 */
export function saveToCache<T>(key: string, data: T, version: string = '1.0'): void {
  try {
    if (typeof window === 'undefined') return;
    
    const cacheData: CachedData<T> = {
      data,
      timestamp: Date.now(),
      version
    };
    
    localStorage.setItem(key, JSON.stringify(cacheData));
  } catch (error) {
    console.warn(`Failed to save cache for ${key}:`, error);
  }
}

/**
 * Load data from localStorage with validation
 */
export function loadFromCache<T>(key: string, maxAge: number = CACHE_DURATIONS.MEDIUM): T | null {
  try {
    if (typeof window === 'undefined') return null;
    
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const parsed: CachedData<T> = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is still valid
    if (now - parsed.timestamp < maxAge) {
      return parsed.data;
    }
  } catch (error) {
    console.warn(`Failed to load cache for ${key}:`, error);
  }
  return null;
}

/**
 * Clear specific cache entry
 */
export function clearCache(key: string): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`Failed to clear cache for ${key}:`, error);
  }
}

/**
 * Clear all application caches
 */
export function clearAllCaches(): void {
  try {
    if (typeof window === 'undefined') return;
    
    Object.values(CACHE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.warn('Failed to clear all caches:', error);
  }
}

/**
 * Get cache age in milliseconds
 */
export function getCacheAge(key: string): number | null {
  try {
    if (typeof window === 'undefined') return null;
    
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const parsed: CachedData = JSON.parse(cached);
    return Date.now() - parsed.timestamp;
  } catch (error) {
    console.warn(`Failed to get cache age for ${key}:`, error);
    return null;
  }
}

/**
 * Check if cache is stale (older than maxAge)
 */
export function isCacheStale(key: string, maxAge: number = CACHE_DURATIONS.MEDIUM): boolean {
  const age = getCacheAge(key);
  return age === null || age > maxAge;
}

/**
 * Invalidate cache when data changes (e.g., after subscription updates)
 */
export function invalidateCache(keys: string[]): void {
  keys.forEach(key => clearCache(key));
}

/**
 * Preload cache for better performance
 */
export function preloadCache<T>(key: string, fetcher: () => Promise<T>, maxAge: number = CACHE_DURATIONS.MEDIUM): Promise<T> {
  return new Promise((resolve, reject) => {
    // Try to load from cache first
    const cached = loadFromCache<T>(key, maxAge);
    if (cached) {
      resolve(cached);
      return;
    }

    // If no cache, fetch and save
    fetcher()
      .then(data => {
        saveToCache(key, data);
        resolve(data);
      })
      .catch(reject);
  });
}

/**
 * Cache invalidation patterns
 */
export const CACHE_INVALIDATION = {
  // Invalidate all caches when user profile changes
  onProfileUpdate: () => invalidateCache([
    CACHE_KEYS.USER_PROFILE,
    CACHE_KEYS.SUBSCRIPTION_DATA,
    CACHE_KEYS.DASHBOARD_STATS
  ]),
  
  // Invalidate subscription-related caches when subscription changes
  onSubscriptionUpdate: () => invalidateCache([
    CACHE_KEYS.SUBSCRIPTION_DATA,
    CACHE_KEYS.USER_PROFILE
  ]),
  
  // Invalidate project-related caches when projects change
  onProjectUpdate: () => invalidateCache([
    CACHE_KEYS.DASHBOARD_STATS,
    CACHE_KEYS.PROJECTS
  ]),
  
  // Invalidate all caches (use sparingly)
  onGlobalUpdate: () => clearAllCaches()
};
