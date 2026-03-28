"use client";

import { useState, useEffect } from "react";
import { SimplifiedPlaylist, DJPlaylistType } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Music2, ChevronDown, ChevronRight } from "lucide-react";
import Image from "next/image";
import { getPlaylistType, savePlaylistType, getPlaylistTypeOptions } from "@/lib/utils/playlistTypes";
import { getPlaylistTypeColor } from "@/lib/utils";

const TYPE_ORDER: Record<string, number> = { hotspot: 0, match: 1, funStuff: 2, preMatch: 3 };

function getPlaylistTypeSelectedColor(type: string): string {
  switch (type) {
    case "hotspot": return "bg-red-500/25 hover:bg-red-500/35";
    case "match":   return "bg-blue-500/25 hover:bg-blue-500/35";
    case "funStuff": return "bg-green-500/25 hover:bg-green-500/35";
    case "preMatch": return "bg-yellow-500/25 hover:bg-yellow-500/35";
    default: return "bg-accent hover:bg-accent/70";
  }
}

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
  const [untypedOpen, setUntypedOpen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => setIsMobile(window.innerWidth < 600);
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Load playlist types from Dexie
  useEffect(() => {
    if (playlists.length === 0) return;
    const load = async () => {
      const entries = await Promise.all(
        playlists.map(async (playlist) => {
          const type = await getPlaylistType(playlist.id);
          return [playlist.id, type] as [string, DJPlaylistType | null];
        })
      );
      const storedTypes = Object.fromEntries(
        entries.filter(([_, type]) => type !== null)
      ) as Record<string, DJPlaylistType>;
      setPlaylistTypes(storedTypes);
    };
    load();
  }, [playlists]);

  const handlePlaylistTypeChange = (playlistId: string, newType: DJPlaylistType) => {
    savePlaylistType(playlistId, newType);
    setPlaylistTypes(prev => ({
      ...prev,
      [playlistId]: newType,
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

  const typedPlaylists = playlists
    .filter(p => playlistTypes[p.id])
    .sort((a, b) => (TYPE_ORDER[playlistTypes[a.id]] ?? 99) - (TYPE_ORDER[playlistTypes[b.id]] ?? 99));
  const untypedPlaylists = playlists.filter(p => !playlistTypes[p.id]);

  const renderPlaylistItem = (playlist: SimplifiedPlaylist) => {
    const type = playlistTypes[playlist.id];
    return (
    <div
      key={playlist.id}
      className={`p-3 cursor-pointer transition-all duration-200 rounded-md w-full ${
        selectedPlaylistId === playlist.id
          ? getPlaylistTypeSelectedColor(type)
          : "hover:bg-accent/50"
      }`}
      onClick={() => onSelectPlaylist(playlist.id)}
    >
      <div className="flex items-center gap-3">
        {type && (
          <div className={`w-1 self-stretch rounded-full shrink-0 ${getPlaylistTypeColor(type)}`} />
        )}
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
          <p className="text-sm text-muted-foreground">{playlist.tracks.total} spor</p>
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
  );
  };

  return (
    <ScrollArea className="h-full">
      <div className="space-y-1 p-2">
        {typedPlaylists.map(renderPlaylistItem)}

        {untypedPlaylists.length > 0 && (
          <>
            <Separator className="my-2" />
            <Collapsible open={untypedOpen} onOpenChange={setUntypedOpen}>
              <CollapsibleTrigger className="flex items-center gap-2 w-full px-1 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                {untypedOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <span>Uten type ({untypedPlaylists.length})</span>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 mt-1">
                {untypedPlaylists.map(renderPlaylistItem)}
              </CollapsibleContent>
            </Collapsible>
          </>
        )}
      </div>
    </ScrollArea>
  );
}
