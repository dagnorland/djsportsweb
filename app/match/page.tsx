// app/match/page.tsx
"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getCurrentlyPlayingTrack } from "@/lib/spotify";
import { SimplifiedPlaylist, PlaylistTrack, CurrentlyPlaying } from "@/lib/types";
import { getAllPlaylistTypes } from "@/lib/utils/playlistTypes";
import PlaylistCarousel from "@/components/PlaylistCarousel";
import { getPlaylistTypeColor } from "@/lib/utils";
import { loadPlaylistsCached, loadMultiplePlaylistTracks, preloadCriticalPlaylists } from "@/lib/spotify/optimized/playlistLoader";
import { playTrackOptimized, updateTrackMapping, getTrackPlaybackMetrics } from "@/lib/spotify/optimized/trackPlayer";
import { performanceMonitor } from "@/lib/utils/performance";
import { logger } from "@/lib/utils/logger";
import { RouteGuard } from "@/components/RouteGuard";
import { usePollingSettings } from "@/lib/hooks/usePollingSettings";
import { TokenExpiredDialog } from "@/components/TokenExpiredDialog";
import { isTokenExpiredError } from "@/lib/utils/tokenExpiry";

export default function MatchPage() {
  const { data: session, status } = useSession();
  const { interval: pollingInterval, setInterval: setPollingInterval } = usePollingSettings();
  const router = useRouter();

  const [playlists, setPlaylists] = useState<SimplifiedPlaylist[]>([]);
  const [hotspotPlaylists, setHotspotPlaylists] = useState<SimplifiedPlaylist[]>([]);
  const [matchPlaylists, setMatchPlaylists] = useState<SimplifiedPlaylist[]>([]);
  const [funStuffPlaylists, setFunStuffPlaylists] = useState<SimplifiedPlaylist[]>([]);
  const [preMatchPlaylists, setPreMatchPlaylists] = useState<SimplifiedPlaylist[]>([]);
  const [playlistTracks, setPlaylistTracks] = useState<Record<string, PlaylistTrack[]>>({});
  const [nowPlaying, setNowPlaying] = useState<CurrentlyPlaying | null>(null);
  const [loading, setLoading] = useState(true);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  const [showPerformanceMetrics, setShowPerformanceMetrics] = useState(false);
  const [autoAdvancePlaylists, setAutoAdvancePlaylists] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastPlayedTrackUri, setLastPlayedTrackUri] = useState<string | null>(null);
  const [showTokenExpiredDialog, setShowTokenExpiredDialog] = useState(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Define callbacks before useEffects
  const loadPlaylistsOptimized = useCallback(async () => {
    if (!session?.accessToken) return;

    try {
      setLoading(true);
      if (process.env.NODE_ENV === 'development') {
        logger.spotify("Loading playlists with caching...");
      }

      const data = await loadPlaylistsCached(session.accessToken, 0, 50);
      setPlaylists(data);

      // Filter playlists by type
      const playlistTypes = getAllPlaylistTypes();
      const hotspot = data.filter(playlist =>
        playlistTypes[playlist.id] === "hotspot"
      );
      const match = data.filter(playlist =>
        playlistTypes[playlist.id] === "match"
      );
      const funStuff = data.filter(playlist =>
        playlistTypes[playlist.id] === "funStuff"
      );
      const preMatch = data.filter(playlist =>
        playlistTypes[playlist.id] === "preMatch"
      );

      setHotspotPlaylists(hotspot);
      setMatchPlaylists(match);
      setFunStuffPlaylists(funStuff);
      setPreMatchPlaylists(preMatch);

      // Preload critical playlists
      const allPlaylists = [...hotspot, ...match, ...funStuff, ...preMatch];
      await preloadCriticalPlaylists(session.accessToken, allPlaylists);

    } catch (error) {
      if (isTokenExpiredError(error)) {
        setShowTokenExpiredDialog(true);
      } else {
        logger.error("Feil ved henting av spillelister:", error);
      }
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  const loadAllPlaylistTracksOptimized = useCallback(async (allPlaylists: SimplifiedPlaylist[]) => {
    if (!session?.accessToken) return;

    try {
      if (process.env.NODE_ENV === 'development') {
        logger.spotify(`Loading tracks for ${allPlaylists.length} playlists with batching...`);
      }

      const tracksMap = await loadMultiplePlaylistTracks(session.accessToken, allPlaylists, 3);
      setPlaylistTracks(tracksMap);

      // Update track mapping for optimized playback
      updateTrackMapping(allPlaylists, tracksMap);

      // Update performance metrics
      const metrics = getTrackPlaybackMetrics();
      setPerformanceMetrics(metrics);

    } catch (error) {
      if (isTokenExpiredError(error)) {
        setShowTokenExpiredDialog(true);
      } else {
        logger.error("Feil ved henting av alle spilleliste-spor:", error);
      }
    }
  }, [session?.accessToken]);

  const updateNowPlaying = useCallback(async () => {
    if (!session?.accessToken) return;

    try {
      const data = await getCurrentlyPlayingTrack(session.accessToken);
      setNowPlaying(data);
    } catch (error) {
      if (isTokenExpiredError(error)) {
        setShowTokenExpiredDialog(true);
      } else {
        setNowPlaying(null);
      }
    }
  }, [session?.accessToken]);

  // Listen for performance metrics toggle from Navigation
  useEffect(() => {
    const handleToggle = () => {
      setShowPerformanceMetrics(prev => !prev);
    };

    window.addEventListener('togglePerformanceMetrics', handleToggle);
    return () => window.removeEventListener('togglePerformanceMetrics', handleToggle);
  }, []);

  // Automatically manage polling interval based on playback state
  useEffect(() => {
    if (nowPlaying?.is_playing && nowPlaying.item) {
      // Clear any existing idle timer when playback resumes
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
        if (process.env.NODE_ENV === 'development') {
          logger.spotify('Cleared idle timer - playback resumed');
        }
      }

      // Song is playing and interval is off → set to 5 seconds
      if (pollingInterval === 0) {
        setPollingInterval(5000);
        if (process.env.NODE_ENV === 'development') {
          logger.spotify('Auto-starting polling (5s) - playback detected');
        }
      }
    } else if (!nowPlaying?.is_playing && pollingInterval > 0 && !idleTimerRef.current) {
      // No song playing and no idle timer running → start 60 second idle timer
      if (process.env.NODE_ENV === 'development') {
        logger.spotify('Starting 60s idle timer - no playback');
      }
      idleTimerRef.current = setTimeout(() => {
        setPollingInterval(0);
        idleTimerRef.current = null;
        if (process.env.NODE_ENV === 'development') {
          logger.spotify('Auto-stopping polling after 60s idle');
        }
      }, 60000); // 60 seconds
    }

    // Cleanup on unmount
    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    };
  }, [nowPlaying, pollingInterval, setPollingInterval]);

  // Load playlists and filter by type
  useEffect(() => {
    if (session?.accessToken) {
      loadPlaylistsOptimized();
      updateNowPlaying();

      // Only set up polling if interval > 0 (not "Off")
      if (pollingInterval > 0) {
        const intervalId = setInterval(updateNowPlaying, pollingInterval); // Use user-configured interval
        return () => clearInterval(intervalId);
      }
    }
  }, [session?.accessToken, loadPlaylistsOptimized, updateNowPlaying, pollingInterval]);

  // Load tracks for all playlists with optimized batching
  useEffect(() => {
    const allPlaylists = [...hotspotPlaylists, ...matchPlaylists, ...funStuffPlaylists, ...preMatchPlaylists];
    if (allPlaylists.length > 0 && session?.accessToken) {
      loadAllPlaylistTracksOptimized(allPlaylists);
    }
  }, [hotspotPlaylists, matchPlaylists, funStuffPlaylists, preMatchPlaylists, session?.accessToken, loadAllPlaylistTracksOptimized]);

  // Handle automatic carousel advancement when track starts playing
  useEffect(() => {
    if (nowPlaying?.is_playing && nowPlaying.item?.uri) {
      const currentTrackUri = nowPlaying.item.uri;
      
      // Only trigger auto-advance if this is a new track (not the same as last played)
      if (currentTrackUri !== lastPlayedTrackUri) {
        if (process.env.NODE_ENV === 'development') {
          logger.spotify(`New track started playing: ${currentTrackUri}`);
        }
        setLastPlayedTrackUri(currentTrackUri);

        // Find which playlist contains the currently playing track
        const allPlaylists = [...hotspotPlaylists, ...matchPlaylists, ...funStuffPlaylists, ...preMatchPlaylists];
        const playingPlaylist = allPlaylists.find(playlist => {
          const tracks = playlistTracks[playlist.id] || [];
          return tracks.some(playlistTrack => playlistTrack.track?.uri === currentTrackUri);
        });

        if (playingPlaylist) {
          if (process.env.NODE_ENV === 'development') {
            logger.spotify(`Setting auto-advance for playlist: ${playingPlaylist.name}`);
          }
          // Always set auto-advance for the playing playlist
          setAutoAdvancePlaylists(prev => new Set([...Array.from(prev), playingPlaylist.id]));
        }
      }
    }
  }, [nowPlaying, hotspotPlaylists, matchPlaylists, funStuffPlaylists, preMatchPlaylists, playlistTracks, lastPlayedTrackUri]);

  const handlePlayTrack = useCallback((trackUri: string, position: number, startTime?: number) => {
    if (!session?.accessToken) return;

    // Clear any previous error messages
    setErrorMessage(null);

    if (process.env.NODE_ENV === 'development') {
      logger.spotify(`Starting track: ${trackUri} at position ${position}${startTime ? ` with start time ${startTime}ms` : ''}`);
    }

    // OPTIMISTIC UPDATE: Update UI immediately for instant feedback
    updateNowPlaying();

    // Fire-and-forget: Start playback without blocking UI
    playTrackOptimized(session.accessToken, {
      trackUri,
      position,
      startTime,
      playlistId: undefined // Will be resolved by the optimized function
    }).then(() => {
      // Update again after playback starts to confirm
      updateNowPlaying();

      // Update performance metrics (dev only)
      if (process.env.NODE_ENV === 'development') {
        const metrics = getTrackPlaybackMetrics();
        setPerformanceMetrics(metrics);
      }
    }).catch((error) => {
      if (isTokenExpiredError(error)) {
        setShowTokenExpiredDialog(true);
      } else {
        logger.error("Feil ved start av spor:", error);

        // Set user-friendly error message
        const errorMsg = error instanceof Error ? error.message : "Ukjent feil ved avspilling";
        setErrorMessage(errorMsg);

        // Clear error message after 5 seconds
        setTimeout(() => setErrorMessage(null), 5000);
      }

      // Revert optimistic update on error
      updateNowPlaying();
    });
  }, [session?.accessToken, updateNowPlaying]);

  // Performance metrics display
  const renderPerformanceMetrics = useMemo(() => {
    if (!showPerformanceMetrics) return null;
    
    const allLogs = performanceMonitor.getLogs();
    const summary = performanceMonitor.getSummary();
    
    return (
      <div className="fixed top-4 right-4 bg-black/90 text-white p-4 rounded-lg text-xs max-w-sm z-50 border border-gray-600">
        <div className="flex justify-between items-center mb-2">
          <div className="font-bold">📊 Performance Monitor</div>
          <button 
            onClick={() => setShowPerformanceMetrics(false)}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        {/* Overall stats */}
        <div className="mb-3 space-y-1">
          <div>Total Operations: {allLogs.length}</div>
          <div>Cache Hits: {summary['load_playlists']?.count || 0}</div>
          <div>Track Loads: {summary['load_playlist_tracks']?.count || 0}</div>
          <div>Track Plays: {summary['play_track_optimized']?.count || 0}</div>
          <div>Spotify API Calls: {summary['spotify_api_call']?.count || 0}</div>
          {summary['spotify_api_call']?.avgDuration && (
            <div className="text-xs text-gray-300">
              Avg Spotify API: {summary['spotify_api_call'].avgDuration.toFixed(2)}ms
            </div>
          )}
        </div>
        
        {/* Recent track starts */}
        {summary['track_start'] && (
          <div className="mt-2">
            <div className="font-semibold mb-1">Recent Track Starts:</div>
            {allLogs
              .filter(log => log.operation === 'track_start')
              .slice(-3)
              .map((log, index) => (
                <div key={index} className="text-xs mb-1">
                  {log.metadata?.trackUri?.split(':').pop()?.substring(0, 15)}... 
                  <br />
                  <span className="text-gray-300">
                    Total: {log.duration?.toFixed(2)}ms
                    {log.metadata?.spotifyApiDuration && (
                      <span> | Spotify: {log.metadata.spotifyApiDuration.toFixed(2)}ms</span>
                    )}
                  </span>
                </div>
              ))}
          </div>
        )}
        
        {/* Performance warnings */}
        {summary['play_track_optimized']?.avgDuration > 1000 && (
          <div className="mt-2 text-yellow-400 text-xs">
            ⚠️ Slow track starts detected
          </div>
        )}
        
        {/* Clear logs button */}
        <button 
          onClick={() => performanceMonitor.clearLogs()}
          className="mt-2 text-xs text-gray-400 hover:text-white underline"
        >
          Clear Logs
        </button>
      </div>
    );
  }, [performanceMetrics, showPerformanceMetrics]);

  const renderPlaylistSection = useCallback((title: string, playlists: SimplifiedPlaylist[], type: string) => {
    if (playlists.length === 0) return null;
    
    return (
      <div className="mb-6 relative">
        {/* Rotated label on the left */}
        <div className="absolute left-[20px] top-[60px] h-full flex items-start pt-4">
          <div className="transform -rotate-90 origin-bottom-left text-lg font-semibold text-muted-foreground whitespace-nowrap">
            {title}
          </div>
        </div>
        
        {/* Content with left margin to avoid overlap */}
        <div className="ml-0">
          <div className={`h-1 w-full rounded-full mb-3 ${getPlaylistTypeColor(type)}`}></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 w-full">
            {playlists.map((playlist) => (
              <PlaylistCarousel
                key={playlist.id}
                playlist={playlist}
                tracks={playlistTracks[playlist.id] || []}
                onPlayTrack={handlePlayTrack}
                isPlaying={nowPlaying?.is_playing || false}
                currentTrackUri={nowPlaying?.item?.uri}
                shouldAutoAdvance={(() => {
                  const shouldAdvance = autoAdvancePlaylists.has(playlist.id);
                  if (shouldAdvance) {
                    logger.spotify(`Auto-advance is TRUE for playlist: ${playlist.name}`);
                  }
                  return shouldAdvance;
                })()}
                onAutoAdvance={() => {
                  logger.spotify(`Auto-advance completed for playlist: ${playlist.name}`);
                  setAutoAdvancePlaylists(prev => {
                    const newSet = new Set(Array.from(prev));
                    newSet.delete(playlist.id);
                    return newSet;
                  });
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }, [playlistTracks, handlePlayTrack, nowPlaying]);

  // Vis loading mens session sjekkes
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle>Laster...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Hvis ikke innlogget, vis ingenting (redirect skjer i useEffect)
  if (!session) {
    return null;
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Laster spillelister...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <RouteGuard requireAuth={true}>
      <TokenExpiredDialog
        open={showTokenExpiredDialog}
        onOpenChange={setShowTokenExpiredDialog}
      />
      <div className="h-[calc(100vh-6rem)] flex flex-col">
      {/* Error message */}
      {errorMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg max-w-md">
          <div className="flex items-center justify-between">
            <span className="text-sm">{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="ml-2 text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Scrollable section for other playlist types */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {renderPlaylistSection("🔥 HOT", hotspotPlaylists, "hotspot")}
        {renderPlaylistSection("⚽ MATCH", matchPlaylists, "match")}
        {renderPlaylistSection("🎉 FUN", funStuffPlaylists, "funStuff")}
        {renderPlaylistSection("🏟️ PRE", preMatchPlaylists, "preMatch")}
        
        {/* Show message if no playlists found */}
        {hotspotPlaylists.length === 0 && matchPlaylists.length === 0 && 
         funStuffPlaylists.length === 0 && preMatchPlaylists.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                Ingen spillelister funnet. Gå til spillelister-siden for å sette type.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      
        {/* Performance metrics overlay */}
        {renderPerformanceMetrics}
      </div>
    </RouteGuard>
  );
}