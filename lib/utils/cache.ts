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
