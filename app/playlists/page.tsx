"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  getCurrentUserPlaylists,
  getPlaylistItems,
  getCurrentlyPlayingTrack,
  pausePlayback,
  startResumePlayback,
  skipToNext,
  skipToPrevious,
  setPlaybackVolume,
  seekToPosition,
} from "@/lib/spotify";
import type {
  SimplifiedPlaylist,
  PlaylistTrack,
  CurrentlyPlaying,
} from "@/lib/types";
import PlaylistSidebar from "@/components/PlaylistSidebar";
import TrackListSwitcher from "@/components/TrackListSwitcher";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { logger } from "@/lib/utils/logger";
import { RouteGuard } from "@/components/RouteGuard";

export default function PlaylistsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [playlists, setPlaylists] = useState<SimplifiedPlaylist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(
    null
  );
  const [selectedPlaylistName, setSelectedPlaylistName] = useState<
    string | null
  >(null);
  const [tracks, setTracks] = useState<PlaylistTrack[]>([]);
  const [nowPlaying, setNowPlaying] = useState<CurrentlyPlaying | null>(null);
  const [loadingPlaylists, setLoadingPlaylists] = useState(true);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  // Define callbacks before useEffects
  const loadPlaylists = useCallback(async () => {
    if (!session?.accessToken) return;

    try {
      setLoadingPlaylists(true);
      const data = await getCurrentUserPlaylists(session.accessToken, 0, 50);
      setPlaylists(data.items);

      // Automatisk velg første playlist hvis ingen er valgt
      if (data.items.length > 0 && !selectedPlaylistId) {
        const firstPlaylist = data.items[0];
        setSelectedPlaylistId(firstPlaylist.id);
        setSelectedPlaylistName(firstPlaylist.name);
      }
    } catch (error) {
      logger.error("Feil ved henting av spillelister:", error);
    } finally {
      setLoadingPlaylists(false);
    }
  }, [session?.accessToken, selectedPlaylistId]);

  const loadTracks = useCallback(async (playlistId: string) => {
    if (!session?.accessToken) return;

    try {
      setLoadingTracks(true);
      const data = await getPlaylistItems(session.accessToken, playlistId, 0, 100);
      setTracks(data.items);
    } catch (error) {
      logger.error("Feil ved henting av spor:", error);
    } finally {
      setLoadingTracks(false);
    }
  }, [session?.accessToken]);

  const updateNowPlaying = useCallback(async () => {
    if (!session?.accessToken) return;

    try {
      const data = await getCurrentlyPlayingTrack(session.accessToken);
      setNowPlaying(data);
    } catch (error) {
      // Ikke logg feil her - det er normalt at ingen sang spilles
      setNowPlaying(null);
    }
  }, [session?.accessToken]);

  // Check if screen width is below 600px
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 600);
    };

    // Check on mount
    checkScreenSize();

    // Listen for resize events
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Hent spillelister ved lasting og start polling for now playing
  useEffect(() => {
    if (session?.accessToken) {
      loadPlaylists();

      // Start polling for now playing hver 5. sekund
      updateNowPlaying();
      const interval = setInterval(updateNowPlaying, 5000);
      return () => clearInterval(interval);
    }
  }, [session?.accessToken, loadPlaylists, updateNowPlaying]);

  // Hent spor når spilleliste velges
  useEffect(() => {
    if (selectedPlaylistId && session?.accessToken) {
      loadTracks(selectedPlaylistId);
    }
  }, [selectedPlaylistId, session?.accessToken, loadTracks]);

  const handleSelectPlaylist = (playlistId: string) => {
    setSelectedPlaylistId(playlistId);
    const playlist = playlists.find((p) => p.id === playlistId);
    setSelectedPlaylistName(playlist?.name || null);
  };

  const handleNavigatePlaylist = (direction: 'next' | 'previous') => {
    if (filteredPlaylists.length === 0) return;
    
    const currentIndex = filteredPlaylists.findIndex(p => p.id === selectedPlaylistId);
    if (currentIndex === -1) return;
    
    let newIndex;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % filteredPlaylists.length;
    } else {
      newIndex = currentIndex === 0 ? filteredPlaylists.length - 1 : currentIndex - 1;
    }
    
    const newPlaylist = filteredPlaylists[newIndex];
    handleSelectPlaylist(newPlaylist.id);
  };

  const handlePlayPause = async () => {
    if (!session?.accessToken) return;

    try {
      if (nowPlaying?.is_playing) {
        await pausePlayback(session.accessToken);
      } else {
        await startResumePlayback(session.accessToken);
      }
      // Oppdater umiddelbart
      setTimeout(updateNowPlaying, 500);
    } catch (error) {
      logger.error("Feil ved play/pause:", error);
    }
  };

  const handleNext = async () => {
    if (!session?.accessToken) return;

    try {
      await skipToNext(session.accessToken);
      setTimeout(updateNowPlaying, 500);
    } catch (error) {
      logger.error("Feil ved neste sang:", error);
    }
  };

  const handlePrevious = async () => {
    if (!session?.accessToken) return;

    try {
      await skipToPrevious(session.accessToken);
      setTimeout(updateNowPlaying, 500);
    } catch (error) {
      logger.error("Feil ved forrige sang:", error);
    }
  };

  const handleVolumeChange = async (volume: number) => {
    if (!session?.accessToken) return;

    try {
      await setPlaybackVolume(session.accessToken, volume);
    } catch (error) {
      logger.error("Feil ved endring av volum:", error);
    }
  };

  const handlePlayTrack = async (trackUri: string, position: number, startTime?: number) => {
    if (!session?.accessToken || !selectedPlaylistId) return;

    try {
      // Find the playlist to get its URI
      const playlist = playlists.find((p) => p.id === selectedPlaylistId);
      if (!playlist) return;

      // Use custom start time if provided, otherwise start from beginning
      const positionMs = startTime && startTime > 0 ? startTime : 0;

      // Start playback with context (playlist) and offset (track position)
      await startResumePlayback(session.accessToken, undefined, {
        context_uri: playlist.uri,
        offset: { position },
        position_ms: positionMs,
      });

      // Update now playing after a short delay
      setTimeout(updateNowPlaying, 500);
    } catch (error) {
      logger.error("Feil ved start av spor:", error);
    }
  };

  // Vis loading mens session sjekkes
  if (status === "loading") {
    return (
      <RouteGuard requireAuth={false}>
        <div className="flex items-center justify-center h-screen">
          <Card className="max-w-sm">
            <CardHeader>
              <CardTitle>Laster...</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </RouteGuard>
    );
  }

  // Filter playlists based on search query
  const filteredPlaylists = playlists.filter(playlist =>
    playlist.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const clearSearch = () => {
    setSearchQuery("");
  };

  const toggleSearch = () => {
    setIsSearchVisible(!isSearchVisible);
    if (isSearchVisible) {
      setSearchQuery("");
    }
  };

  // Hvis ikke innlogget, vis ingenting (redirect skjer i useEffect)
  if (!session) {
    return null;
  }

// app/playlists/page.tsx - Oppdater bare return-delen
// ... existing code ...

return (
  <RouteGuard requireAuth={true}>
    <div className="flex h-[calc(100vh-6rem)] flex-col">
      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
      {/* Left sidebar - Playlists */}
      <aside className={`${isMobile ? 'w-48' : 'w-80'} border-r overflow-y-auto p-4`}>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-2xl font-bold">Dine spillelister</h2>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleSearch}
            className="h-8 w-8 p-0"
            title={isSearchVisible ? "Skjul søk" : "Søk spillelister"}
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
        
        {isSearchVisible && (
          <div className="mb-4 space-y-2">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Søk spillelister..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
                autoFocus
              />
              {searchQuery && (
                <Button variant="outline" size="sm" onClick={clearSearch} className="h-8 w-8 p-0">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {searchQuery && (
              <p className="text-sm text-muted-foreground">
                {filteredPlaylists.length} spilleliste{filteredPlaylists.length !== 1 ? 'r' : ''} funnet
              </p>
            )}
          </div>
        )}
        
        <PlaylistSidebar
          playlists={filteredPlaylists}
          selectedPlaylistId={selectedPlaylistId}
          onSelectPlaylist={handleSelectPlaylist}
          loading={loadingPlaylists}
        />
      </aside>

      {/* Right panel - Tracks */}
      <main className="flex-1 overflow-y-auto">
        {selectedPlaylistId ? (
          <div className="p-6">
            {selectedPlaylistName && (
              <h2 className="text-3xl font-bold mb-6">
                {selectedPlaylistName}
              </h2>
            )}
            <TrackListSwitcher 
              tracks={tracks} 
              loading={loadingTracks} 
              onPlayTrack={handlePlayTrack}
              onPauseTrack={async () => {
                if (session?.accessToken) {
                  try {
                    await pausePlayback(session.accessToken);
                    setTimeout(updateNowPlaying, 500);
                  } catch (error) {
                    logger.error("Feil ved pause:", error);
                  }
                }
              }}
              onNavigatePlaylist={handleNavigatePlaylist}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">
                Velg en spilleliste
              </h3>
              <p className="text-muted-foreground">
                Klikk på en spilleliste til venstre for å se sporene
              </p>
            </div>
          </div>
        )}
      </main>
    </div>

    </div>
  </RouteGuard>
);
}

