// app/match/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getCurrentUserPlaylists, getPlaylistItems, getCurrentlyPlayingTrack } from "@/lib/spotify";
import { SimplifiedPlaylist, PlaylistTrack, CurrentlyPlaying } from "@/lib/types";
import { getAllPlaylistTypes } from "@/lib/utils/playlistTypes";
import PlaylistCarousel from "@/components/PlaylistCarousel";
import { getPlaylistTypeColor } from "@/lib/utils";

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

  // Redirect til login hvis ikke innlogget
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Load playlists and filter hotspot ones
  useEffect(() => {
    if (session?.accessToken) {
      loadPlaylists();
      updateNowPlaying();
      const interval = setInterval(updateNowPlaying, 5000);
      return () => clearInterval(interval);
    }
  }, [session]);

  // Load tracks for all playlists
  useEffect(() => {
    const allPlaylists = [...hotspotPlaylists, ...matchPlaylists, ...funStuffPlaylists, ...preMatchPlaylists];
    if (allPlaylists.length > 0 && session?.accessToken) {
      loadAllPlaylistTracks();
    }
  }, [hotspotPlaylists, matchPlaylists, funStuffPlaylists, preMatchPlaylists, session]);

  const loadPlaylists = async () => {
    if (!session?.accessToken) return;

    try {
      setLoading(true);
      const data = await getCurrentUserPlaylists(session.accessToken, 0, 50);
      setPlaylists(data.items);
      
      // Filter playlists by type
      const playlistTypes = getAllPlaylistTypes();
      const hotspot = data.items.filter(playlist => 
        playlistTypes[playlist.id] === "hotspot"
      );
      const match = data.items.filter(playlist => 
        playlistTypes[playlist.id] === "match"
      );
      const funStuff = data.items.filter(playlist => 
        playlistTypes[playlist.id] === "funStuff"
      );
      const preMatch = data.items.filter(playlist => 
        playlistTypes[playlist.id] === "preMatch"
      );
      
      setHotspotPlaylists(hotspot);
      setMatchPlaylists(match);
      setFunStuffPlaylists(funStuff);
      setPreMatchPlaylists(preMatch);
    } catch (error) {
      console.error("Feil ved henting av spillelister:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllPlaylistTracks = async () => {
    if (!session?.accessToken) return;

    try {
      const allPlaylists = [...hotspotPlaylists, ...matchPlaylists, ...funStuffPlaylists, ...preMatchPlaylists];
      const tracksPromises = allPlaylists.map(async (playlist) => {
        try {
          const data = await getPlaylistItems(session.accessToken!, playlist.id, 0, 100);
          return { playlistId: playlist.id, tracks: data.items };
        } catch (error) {
          console.error(`Feil ved henting av spor for ${playlist.name}:`, error);
          return { playlistId: playlist.id, tracks: [] };
        }
      });

      const results = await Promise.all(tracksPromises);
      const tracksMap: Record<string, PlaylistTrack[]> = {};
      
      results.forEach(({ playlistId, tracks }) => {
        tracksMap[playlistId] = tracks;
      });
      
      setPlaylistTracks(tracksMap);
    } catch (error) {
      console.error("Feil ved henting av alle spilleliste-spor:", error);
    }
  };

  const updateNowPlaying = async () => {
    if (!session?.accessToken) return;

    try {
      const data = await getCurrentlyPlayingTrack(session.accessToken);
      setNowPlaying(data);
    } catch (error) {
      setNowPlaying(null);
    }
  };

  const handlePlayTrack = async (trackUri: string, position: number, startTime?: number) => {
    if (!session?.accessToken) return;

    try {
      // Find the playlist containing this track
      const allPlaylists = [...hotspotPlaylists, ...matchPlaylists, ...funStuffPlaylists, ...preMatchPlaylists];
      const playlist = allPlaylists.find(p => 
        playlistTracks[p.id]?.some(track => track.track?.uri === trackUri)
      );
      
      if (!playlist) return;

      // Use custom start time if provided, otherwise start from beginning
      const positionMs = startTime && startTime > 0 ? startTime : 0;

      // Start playback with context (playlist) and offset (track position)
      const { startResumePlayback } = await import("@/lib/spotify");
      await startResumePlayback(session.accessToken, undefined, {
        context_uri: playlist.uri,
        offset: { position },
        position_ms: positionMs,
      });

      // Update now playing after a short delay
      setTimeout(updateNowPlaying, 500);
    } catch (error) {
      console.error("Feil ved start av spor:", error);
    }
  };

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

  const renderPlaylistSection = (title: string, playlists: SimplifiedPlaylist[], type: string) => {
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
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col">

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
    </div>
  );
}