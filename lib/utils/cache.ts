/**
 * Caching utilities for improved performance
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

const CACHE_PREFIX = 'djsports_';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 50; // Maximum number of cache entries

/**
 * Get cached data with TTL check
 */
export function getCachedData<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const cached = sessionStorage.getItem(CACHE_PREFIX + key);
    if (!cached) return null;
    
    const item: CacheItem<T> = JSON.parse(cached);
    const now = Date.now();
    
    if (now - item.timestamp > item.ttl) {
      sessionStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    
    return item.data;
  } catch (error) {
    console.error('Failed to get cached data:', error);
    return null;
  }
}

/**
 * Set cached data with TTL
 */
export function setCachedData<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Check cache size and clean up if necessary
    const cacheKeys = Object.keys(sessionStorage).filter(k => k.startsWith(CACHE_PREFIX));
    if (cacheKeys.length >= MAX_CACHE_SIZE) {
      // Remove oldest entries (simple LRU-like cleanup)
      const entries = cacheKeys.map(k => ({
        key: k,
        timestamp: JSON.parse(sessionStorage.getItem(k) || '{}').timestamp || 0
      })).sort((a, b) => a.timestamp - b.timestamp);
      
      // Remove oldest 25% of entries
      const toRemove = Math.floor(entries.length * 0.25);
      for (let i = 0; i < toRemove; i++) {
        sessionStorage.removeItem(entries[i].key);
      }
    }
    
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl
    };
    
    sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item));
  } catch (error) {
    console.error('Failed to set cached data:', error);
  }
}

/**
 * Clear specific cache entry
 */
export function clearCachedData(key: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(CACHE_PREFIX + key);
}

/**
 * Clear all cache entries
 */
export function clearAllCache(): void {
  if (typeof window === 'undefined') return;
  
  const keys = Object.keys(sessionStorage);
  keys.forEach(key => {
    if (key.startsWith(CACHE_PREFIX)) {
      sessionStorage.removeItem(key);
    }
  });
}

/**
 * Cache keys for different data types
 */
export const CACHE_KEYS = {
  PLAYLISTS: 'playlists',
  PLAYLIST_TRACKS: (playlistId: string) => `playlist_tracks_${playlistId}`,
  NOW_PLAYING: 'now_playing',
  PLAYLIST_TYPES: 'playlist_types'
} as const;
