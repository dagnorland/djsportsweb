// app/match/page.tsx
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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

export default function MatchPage() {
  const { data: session, status } = useSession();
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

  // Redirect til login hvis ikke innlogget
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Load playlists and filter by type
  useEffect(() => {
    if (session?.accessToken) {
      loadPlaylistsOptimized();
      updateNowPlaying();
      const interval = setInterval(updateNowPlaying, 10000); // Reduced frequency
      return () => clearInterval(interval);
    }
  }, [session]);

  // Load tracks for all playlists with optimized batching
  useEffect(() => {
    const allPlaylists = [...hotspotPlaylists, ...matchPlaylists, ...funStuffPlaylists, ...preMatchPlaylists];
    if (allPlaylists.length > 0 && session?.accessToken) {
      loadAllPlaylistTracksOptimized(allPlaylists);
    }
  }, [hotspotPlaylists, matchPlaylists, funStuffPlaylists, preMatchPlaylists, session]);

  const loadPlaylistsOptimized = useCallback(async () => {
    if (!session?.accessToken) return;

    try {
      setLoading(true);
      console.log("🚀 Loading playlists with caching...");
      
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
      console.error("Feil ved henting av spillelister:", error);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  const loadAllPlaylistTracksOptimized = useCallback(async (allPlaylists: SimplifiedPlaylist[]) => {
    if (!session?.accessToken) return;

    try {
      console.log(`🎵 Loading tracks for ${allPlaylists.length} playlists with batching...`);
      
      const tracksMap = await loadMultiplePlaylistTracks(session.accessToken, allPlaylists, 3);
      setPlaylistTracks(tracksMap);
      
      // Update track mapping for optimized playback
      updateTrackMapping(allPlaylists, tracksMap);
      
      // Update performance metrics
      const metrics = getTrackPlaybackMetrics();
      setPerformanceMetrics(metrics);
      
    } catch (error) {
      console.error("Feil ved henting av alle spilleliste-spor:", error);
    }
  }, [session?.accessToken]);

  const updateNowPlaying = async () => {
    if (!session?.accessToken) return;

    try {
      const data = await getCurrentlyPlayingTrack(session.accessToken);
      setNowPlaying(data);
    } catch (error) {
      setNowPlaying(null);
    }
  };

  const handlePlayTrack = useCallback(async (trackUri: string, position: number, startTime?: number) => {
    if (!session?.accessToken) return;

    try {
      console.log(`🎵 Starting track: ${trackUri} at position ${position}${startTime ? ` with start time ${startTime}ms` : ''}`);
      
      // Use optimized track playback
      await playTrackOptimized(session.accessToken, {
        trackUri,
        position,
        startTime,
        playlistId: undefined // Will be resolved by the optimized function
      });

      // Update now playing after a short delay
      setTimeout(updateNowPlaying, 500);
      
      // Update performance metrics
      const metrics = getTrackPlaybackMetrics();
      setPerformanceMetrics(metrics);
      
    } catch (error) {
      console.error("Feil ved start av spor:", error);
    }
  }, [session?.accessToken, updateNowPlaying]);

  // Performance metrics display
  const renderPerformanceMetrics = useMemo(() => {
    if ((process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'production') || !showPerformanceMetrics) return null;
    
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {playlists.map((playlist) => (
              <PlaylistCarousel
                key={playlist.id}
                playlist={playlist}
                tracks={playlistTracks[playlist.id] || []}
                onPlayTrack={handlePlayTrack}
                isPlaying={nowPlaying?.is_playing || false}
                currentTrackUri={nowPlaying?.item?.uri}
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
    <div className="h-[calc(100vh-6rem)] flex flex-col">
      {/* Performance toggle button (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={() => setShowPerformanceMetrics(!showPerformanceMetrics)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
          >
            {showPerformanceMetrics ? 'Hide' : 'Show'} Performance
          </button>
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
  );
}