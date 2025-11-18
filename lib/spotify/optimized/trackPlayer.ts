/**
 * Optimized track playback with pre-computed mappings and performance logging
 */

import { startResumePlayback } from "@/lib/spotify";
import { withTiming, logTrackStart, logTrackStartComplete, performanceMonitor } from "@/lib/utils/performance";
import { SimplifiedPlaylist, PlaylistTrack } from "@/lib/types";
import { getCachedDevice } from "@/lib/utils/deviceCache";

// Environment flag for debug logging
const DEBUG_MODE = process.env.NODE_ENV === 'development';

interface TrackPlaybackOptions {
  trackUri: string;
  position: number;
  startTime?: number;
  playlistId?: string;
}

interface PlaylistTrackMapping {
  [trackUri: string]: {
    playlistId: string;
    playlistUri: string;
    position: number;
  };
}

/**
 * Pre-computed mapping for fast track lookup
 */
class TrackMappingCache {
  private mapping: PlaylistTrackMapping = {};
  private lastUpdated: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  updateMapping(playlists: SimplifiedPlaylist[], playlistTracks: Record<string, PlaylistTrack[]>) {
    const newMapping: PlaylistTrackMapping = {};
    
    playlists.forEach(playlist => {
      const tracks = playlistTracks[playlist.id] || [];
      tracks.forEach((playlistTrack, index) => {
        if (playlistTrack.track?.uri) {
          newMapping[playlistTrack.track.uri] = {
            playlistId: playlist.id,
            playlistUri: playlist.uri,
            position: index
          };
        }
      });
    });

    this.mapping = newMapping;
    this.lastUpdated = Date.now();
  }

  getTrackInfo(trackUri: string) {
    // Check if cache is still valid
    if (Date.now() - this.lastUpdated > this.CACHE_DURATION) {
      console.warn('Track mapping cache expired');
      return null;
    }
    
    return this.mapping[trackUri] || null;
  }

  isCacheValid(): boolean {
    return Date.now() - this.lastUpdated < this.CACHE_DURATION;
  }

  clearCache() {
    this.mapping = {};
    this.lastUpdated = 0;
  }
}

// Global track mapping cache
const trackMappingCache = new TrackMappingCache();

/**
 * Optimized track playback with pre-computed lookup
 * SPEED OPTIMIZED: Minimal logging in production, performance monitoring only in debug mode
 * 
 * @param startTimeMs Optional timestamp when the user clicked (from performance.now())
 */
export const playTrackOptimized = async (
  token: string, 
  options: TrackPlaybackOptions,
  startTimeMs?: number
) => {
  const { trackUri, startTime } = options;
  
  // If startTimeMs is provided, use it; otherwise start timing now
  const actualStartTime = startTimeMs ?? performance.now();

  // Always track performance (for feedback system)
  const trackStartId = performanceMonitor.startTiming('track_start', {
    trackUri,
    startTime,
    playlistId: options.playlistId,
    timestamp: new Date().toISOString(),
    userClickTime: startTimeMs
  });

  try {
    if (DEBUG_MODE) {
      console.log(`🎵 Starting track: ${trackUri}${startTime ? ` at ${startTime}ms` : ''}`);
    }

    // Get track info from pre-computed mapping (optimized lookup)
    const trackInfo = trackMappingCache.getTrackInfo(trackUri);

    // Use custom start time if provided, otherwise start from beginning
    const positionMs = startTime && startTime > 0 ? startTime : 0;

    // Get cached device ID for faster playback (avoids device lookup delay)
    const cachedDevice = getCachedDevice();
    const deviceId = cachedDevice?.id;

    let playbackPromise: Promise<void>;
    let spotifyApiId: string;

    if (trackInfo) {
      // Track found in mapping - use playlist context (faster, better for queue)
      if (DEBUG_MODE) {
        console.log(`📍 Found track in playlist: ${trackInfo.playlistId} at position ${trackInfo.position}`);
      }

      // Start timing Spotify API call specifically
      spotifyApiId = performanceMonitor.startTiming('spotify_api_call', {
        trackUri,
        playlistId: trackInfo.playlistId,
        position: trackInfo.position,
        deviceId: deviceId || 'default',
        method: 'playlist_context'
      });

      if (DEBUG_MODE) {
        console.log(`🚀 Sending request to Spotify API${deviceId ? ` (device: ${cachedDevice?.name})` : ''}...`);
      }

      // Start playback with optimized parameters - use cached device ID for faster start
      playbackPromise = startResumePlayback(token, deviceId, {
        context_uri: trackInfo.playlistUri,
        offset: { position: trackInfo.position },
        position_ms: positionMs,
      });
    } else {
      // Track not in mapping - fallback to direct track playback
      if (DEBUG_MODE) {
        console.warn(`⚠️ Track not found in mapping: ${trackUri}, using direct playback fallback`);
      }

      // Start timing Spotify API call specifically
      spotifyApiId = performanceMonitor.startTiming('spotify_api_call', {
        trackUri,
        deviceId: deviceId || 'default',
        method: 'direct_uri'
      });

      if (DEBUG_MODE) {
        console.log(`🚀 Sending direct playback request to Spotify API${deviceId ? ` (device: ${cachedDevice?.name})` : ''}...`);
      }

      // Fallback: Play track directly by URI (no playlist context)
      playbackPromise = startResumePlayback(token, deviceId, {
        uris: [trackUri],
        position_ms: positionMs,
      });
    }

    // Fire and forget - don't wait for response parsing
    await playbackPromise;

    // Calculate Spotify API response time
    const spotifyApiDuration = performanceMonitor.endTiming(spotifyApiId) ?? 0;

    if (DEBUG_MODE) {
      console.log(`⚡ Spotify API responded in ${spotifyApiDuration.toFixed(2)}ms`);
    }

    // Don't end timing here - wait for actual playback to start
    // Just update metadata with API response time
    performanceMonitor.updateMetadata(trackStartId, {
      spotifyApiDuration,
      apiResponseTime: performance.now() - actualStartTime
    });

    if (DEBUG_MODE) {
      const apiResponseTime = performance.now() - actualStartTime;
      console.log(`✅ Track API call completed in ${apiResponseTime.toFixed(2)}ms (Spotify API: ${spotifyApiDuration.toFixed(2)}ms)`);
    }

    return {
      success: true,
      trackInfo: trackInfo || null, // May be null if using fallback
      duration: 0, // Will be updated when playback actually starts
      spotifyApiDuration,
      // Return the trackStartId so caller can track when playback actually starts
      trackStartId
    };
  } catch (error) {
    performanceMonitor.endTiming(trackStartId);
    console.error(`❌ Failed to play track: ${trackUri}`, error);
    throw error;
  }
};

/**
 * Update track mapping when playlists or tracks change
 */
export const updateTrackMapping = (
  playlists: SimplifiedPlaylist[],
  playlistTracks: Record<string, PlaylistTrack[]>
) => {
  trackMappingCache.updateMapping(playlists, playlistTracks);
  if (DEBUG_MODE) {
    console.log(`🗺️ Updated track mapping for ${playlists.length} playlists`);
  }
};

/**
 * Get track info for a specific track URI
 */
export const getTrackInfo = (trackUri: string) => {
  return trackMappingCache.getTrackInfo(trackUri);
};

/**
 * Check if track mapping is valid
 */
export const isTrackMappingValid = () => {
  return trackMappingCache.isCacheValid();
};

/**
 * Clear track mapping cache
 */
export const clearTrackMapping = () => {
  trackMappingCache.clearCache();
};

/**
 * Batch update track mappings for multiple playlists
 */
export const batchUpdateTrackMappings = (
  playlistData: Array<{
    playlist: SimplifiedPlaylist;
    tracks: PlaylistTrack[];
  }>
) => {
  const playlists: SimplifiedPlaylist[] = [];
  const playlistTracks: Record<string, PlaylistTrack[]> = {};

  playlistData.forEach(({ playlist, tracks }) => {
    playlists.push(playlist);
    playlistTracks[playlist.id] = tracks;
  });

  updateTrackMapping(playlists, playlistTracks);
};

/**
 * Get performance metrics for track playback
 */
export const getTrackPlaybackMetrics = () => {
  const logs = performanceMonitor.getLogsForOperation('play_track_optimized');
  const trackStartLogs = performanceMonitor.getLogsForOperation('track_start');

  return {
    totalPlays: logs.length,
    avgPlaybackTime: performanceMonitor.getAverageDuration('play_track_optimized'),
    totalPlaybackTime: logs.reduce((sum, log) => sum + (log.duration || 0), 0),
    trackStartTimes: trackStartLogs.map(log => ({
      trackUri: log.metadata?.trackUri,
      duration: log.duration,
      timestamp: log.metadata?.timestamp
    }))
  };
};
