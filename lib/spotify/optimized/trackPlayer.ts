/**
 * Optimized track playback with pre-computed mappings and performance logging
 */

import { startResumePlayback, getAvailableDevices } from "@/lib/spotify";
import { withTiming, logTrackStart, logTrackStartComplete, performanceMonitor } from "@/lib/utils/performance";
import { SimplifiedPlaylist, PlaylistTrack } from "@/lib/types";

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
 */
export const playTrackOptimized = withTiming(
  'play_track_optimized',
  async (token: string, options: TrackPlaybackOptions) => {
    const { trackUri, startTime } = options;
    
    // Start detailed performance logging
    const trackStartId = performanceMonitor.startTiming('track_start', {
      trackUri,
      startTime,
      playlistId: options.playlistId,
      timestamp: new Date().toISOString()
    });

    try {
      console.log(`🎵 Starting track: ${trackUri}${startTime ? ` at ${startTime}ms` : ''}`);
      
      // Check for available devices first
      console.log(`🔍 Checking for available Spotify devices...`);
      const devices = await getAvailableDevices(token);
      
      if (!devices || devices.length === 0) {
        throw new Error("Ingen Spotify-enheter tilgjengelig. Vennligst åpne Spotify på en enhet og prøv igjen.");
      }
      
      const activeDevice = devices.find(device => device.is_active);
      if (!activeDevice) {
        console.log(`⚠️ Ingen aktiv enhet funnet. Tilgjengelige enheter: ${devices.map(d => d.name).join(', ')}`);
        throw new Error("Ingen aktiv Spotify-enhet. Vennligst åpne Spotify på en enhet og prøv igjen.");
      }
      
      console.log(`✅ Aktiv enhet funnet: ${activeDevice.name} (${activeDevice.type})`);
      
      // Get track info from pre-computed mapping
      const trackInfo = trackMappingCache.getTrackInfo(trackUri);
      
      if (!trackInfo) {
        throw new Error(`Track not found in mapping: ${trackUri}`);
      }

      console.log(`📍 Found track in playlist: ${trackInfo.playlistId} at position ${trackInfo.position}`);

      // Use custom start time if provided, otherwise start from beginning
      const positionMs = startTime && startTime > 0 ? startTime : 0;

      // Start timing Spotify API call specifically
      const spotifyApiId = performanceMonitor.startTiming('spotify_api_call', {
        trackUri,
        playlistId: trackInfo.playlistId,
        position: trackInfo.position
      });
      
      console.log(`🚀 Sending request to Spotify API...`);
      
      // Start playback with optimized parameters
      await startResumePlayback(token, activeDevice.id || undefined, {
        context_uri: trackInfo.playlistUri,
        offset: { position: trackInfo.position },
        position_ms: positionMs,
      });

      // Calculate Spotify API response time
      const spotifyApiDuration = performanceMonitor.endTiming(spotifyApiId);
      
      console.log(`⚡ Spotify API responded in ${spotifyApiDuration?.toFixed(2)}ms`);

      // Log successful completion with Spotify API timing in metadata
      const totalDuration = performanceMonitor.endTiming(trackStartId);
      console.log(`✅ Track started successfully in ${totalDuration?.toFixed(2)}ms (Spotify API: ${spotifyApiDuration?.toFixed(2)}ms)`);
      
      // Update the log with Spotify API timing
      const recentLogs = performanceMonitor.getLogs();
      const lastLog = recentLogs[recentLogs.length - 1];
      if (lastLog && lastLog.operation === 'track_start') {
        lastLog.metadata = {
          ...lastLog.metadata,
          spotifyApiDuration
        };
      }
      
      return { 
        success: true, 
        trackInfo, 
        duration: totalDuration,
        spotifyApiDuration 
      };
    } catch (error) {
      performanceMonitor.endTiming(trackStartId);
      console.error(`❌ Failed to play track: ${trackUri}`, error);
      throw error;
    }
  }
);

/**
 * Update track mapping when playlists or tracks change
 */
export const updateTrackMapping = (
  playlists: SimplifiedPlaylist[],
  playlistTracks: Record<string, PlaylistTrack[]>
) => {
  trackMappingCache.updateMapping(playlists, playlistTracks);
  console.log(`🗺️ Updated track mapping for ${playlists.length} playlists`);
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
