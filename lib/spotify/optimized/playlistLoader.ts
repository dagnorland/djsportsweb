/**
 * Optimized playlist and track loading with caching and batch operations
 */

import { getCurrentUserPlaylists, getPlaylistItems } from "@/lib/spotify";
import { getCachedData, setCachedData, CACHE_KEYS } from "@/lib/utils/cache";
import { withTiming, performanceMonitor } from "@/lib/utils/performance";
import { SimplifiedPlaylist, PlaylistTrack } from "@/lib/types";

interface PlaylistWithTracks {
  playlist: SimplifiedPlaylist;
  tracks: PlaylistTrack[];
}

/**
 * Load playlists with caching
 */
export const loadPlaylistsCached = withTiming(
  'load_playlists',
  async (token: string, offset: number = 0, limit: number = 50) => {
    // Check cache first
    const cacheKey = `${CACHE_KEYS.PLAYLISTS}_${offset}_${limit}`;
    const cached = getCachedData<SimplifiedPlaylist[]>(cacheKey);
    
    if (cached) {
      console.log('📦 Using cached playlists (cache hit)');
      return cached;
    }

    console.log('🌐 Fetching playlists from API (cache miss)');
    const data = await getCurrentUserPlaylists(token, offset, limit);
    
    // Cache the result
    setCachedData(cacheKey, data.items, 10 * 60 * 1000); // 10 minutes
    console.log(`💾 Cached ${data.items.length} playlists for 10 minutes`);
    
    return data.items;
  }
);

/**
 * Load tracks for a single playlist with caching
 */
export const loadPlaylistTracksCached = withTiming(
  'load_playlist_tracks',
  async (token: string, playlistId: string, offset: number = 0, limit: number = 100) => {
    const cacheKey = CACHE_KEYS.PLAYLIST_TRACKS(playlistId);
    const cached = getCachedData<PlaylistTrack[]>(cacheKey);
    
    if (cached) {
      console.log(`📦 Using cached tracks for playlist ${playlistId}`);
      return cached;
    }

    console.log(`🌐 Fetching tracks for playlist ${playlistId}`);
    const data = await getPlaylistItems(token, playlistId, offset, limit);
    
    // Cache the result
    setCachedData(cacheKey, data.items, 15 * 60 * 1000); // 15 minutes
    
    return data.items;
  }
);

/**
 * Load tracks for multiple playlists with optimized batching
 */
export const loadMultiplePlaylistTracks = withTiming(
  'load_multiple_playlist_tracks',
  async (token: string, playlists: SimplifiedPlaylist[], maxConcurrent: number = 3) => {
    const results: Record<string, PlaylistTrack[]> = {};
    
    // Process playlists in batches to avoid overwhelming the API
    for (let i = 0; i < playlists.length; i += maxConcurrent) {
      const batch = playlists.slice(i, i + maxConcurrent);
      
      const batchPromises = batch.map(async (playlist) => {
        try {
          const tracks = await loadPlaylistTracksCached(token, playlist.id);
          return { playlistId: playlist.id, tracks };
        } catch (error) {
          console.error(`Failed to load tracks for playlist ${playlist.name}:`, error);
          return { playlistId: playlist.id, tracks: [] };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          results[result.value.playlistId] = result.value.tracks;
        }
      });

      // Small delay between batches to be nice to the API
      if (i + maxConcurrent < playlists.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }
);

/**
 * Lazy load tracks for a playlist only when needed
 */
export const lazyLoadPlaylistTracks = async (
  token: string,
  playlistId: string,
  onLoad: (tracks: PlaylistTrack[]) => void
) => {
  try {
    const tracks = await loadPlaylistTracksCached(token, playlistId);
    onLoad(tracks);
  } catch (error) {
    console.error(`Failed to lazy load tracks for playlist ${playlistId}:`, error);
    onLoad([]);
  }
};

/**
 * Preload critical playlists (hotspot and match)
 */
export const preloadCriticalPlaylists = async (
  token: string,
  playlists: SimplifiedPlaylist[]
) => {
  const criticalTypes = ['hotspot', 'match'];
  const criticalPlaylists = playlists.filter(playlist => {
    // This would need to be integrated with your playlist type system
    return criticalTypes.some(type => playlist.name.toLowerCase().includes(type));
  });

  if (criticalPlaylists.length > 0) {
    console.log(`🚀 Preloading ${criticalPlaylists.length} critical playlists`);
    await loadMultiplePlaylistTracks(token, criticalPlaylists, 2);
  }
};

/**
 * Get performance metrics for playlist loading
 */
export const getPlaylistLoadingMetrics = () => {
  const logs = performanceMonitor.getLogsForOperation('load_playlists');
  const trackLogs = performanceMonitor.getLogsForOperation('load_playlist_tracks');
  const batchLogs = performanceMonitor.getLogsForOperation('load_multiple_playlist_tracks');

  return {
    playlists: {
      count: logs.length,
      avgDuration: performanceMonitor.getAverageDuration('load_playlists'),
      totalDuration: logs.reduce((sum, log) => sum + (log.duration || 0), 0)
    },
    tracks: {
      count: trackLogs.length,
      avgDuration: performanceMonitor.getAverageDuration('load_playlist_tracks'),
      totalDuration: trackLogs.reduce((sum, log) => sum + (log.duration || 0), 0)
    },
    batches: {
      count: batchLogs.length,
      avgDuration: performanceMonitor.getAverageDuration('load_multiple_playlist_tracks'),
      totalDuration: batchLogs.reduce((sum, log) => sum + (log.duration || 0), 0)
    }
  };
};
