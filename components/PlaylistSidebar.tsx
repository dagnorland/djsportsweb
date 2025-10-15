"use client";

import { useState, useEffect } from "react";
import { SimplifiedPlaylist, DJPlaylistType } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Music2, Settings } from "lucide-react";
import Image from "next/image";
import { getPlaylistType, savePlaylistType, getPlaylistTypeOptions } from "@/lib/utils/playlistTypes";

interface PlaylistSidebarProps {
  playlists: SimplifiedPlaylist[];
  selectedPlaylistId: string | null;
  onSelectPlaylist: (playlistId: string) => void;
  loading?: boolean;
}

export default function PlaylistSidebar({
  playlists,
  selectedPlaylistId,
  onSelectPlaylist,
  loading = false,
}: PlaylistSidebarProps) {
  const [playlistTypes, setPlaylistTypes] = useState<Record<string, DJPlaylistType>>({});
  const [isMobile, setIsMobile] = useState(false);

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

  // Load playlist types from localStorage
  useEffect(() => {
    const types = getPlaylistTypeOptions().reduce((acc, option) => {
      // This is just to initialize the structure, actual values come from localStorage
      return acc;
    }, {} as Record<string, DJPlaylistType>);
    
    // Load actual stored types
    const storedTypes = Object.fromEntries(
      playlists.map(playlist => {
        const type = getPlaylistType(playlist.id);
        return [playlist.id, type];
      }).filter(([_, type]) => type !== null)
    );
    
    setPlaylistTypes(storedTypes);
  }, [playlists]);

  const handlePlaylistTypeChange = (playlistId: string, newType: DJPlaylistType) => {
    savePlaylistType(playlistId, newType);
    setPlaylistTypes(prev => ({
      ...prev,
      [playlistId]: newType
    }));
  };

  if (loading) {
    return (
      <div className="space-y-1">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-3 rounded-md animate-pulse">
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 bg-muted rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (playlists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Music2 className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Ingen spillelister funnet</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-1 p-2">
        {playlists.map((playlist) => (
          <div
            key={playlist.id}
            className={`p-3 cursor-pointer transition-all duration-200 rounded-md hover:bg-accent/50 w-full ${
              selectedPlaylistId === playlist.id
                ? "bg-accent hover:bg-accent/70"
                : ""
            }`}
            onClick={() => onSelectPlaylist(playlist.id)}
          >
            <div className="flex items-center gap-3">
              {!isMobile && playlist.images && playlist.images.length > 0 ? (
                <Image
                  src={playlist.images[0].url}
                  alt={playlist.name}
                  width={64}
                  height={64}
                  className="rounded object-cover"
                />
              ) : !isMobile ? (
                <div className="h-16 w-16 bg-muted rounded flex items-center justify-center">
                  <Music2 className="h-8 w-8 text-muted-foreground" />
                </div>
              ) : null}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{playlist.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {playlist.tracks.total} spor
                </p>
                {/* DJ Playlist Type Dropdown */}
                <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={playlistTypes[playlist.id] || ""}
                    onValueChange={(value: DJPlaylistType) => handlePlaylistTypeChange(playlist.id, value)}
                  >
                    <SelectTrigger className={`h-8 text-xs w-full ${isMobile ? 'max-w-none' : 'max-w-[170px]'}`}>
                      <SelectValue placeholder="Velg type" />
                    </SelectTrigger>
                    <SelectContent>
                      {getPlaylistTypeOptions().map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}