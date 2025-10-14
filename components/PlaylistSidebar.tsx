"use client";

import { SimplifiedPlaylist } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Music2 } from "lucide-react";
import Image from "next/image";

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
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 bg-muted rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          </Card>
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
      <div className="space-y-2">
        {playlists.map((playlist) => (
          <Card
            key={playlist.id}
            className={`p-3 cursor-pointer transition-all hover:bg-accent ${
              selectedPlaylistId === playlist.id
                ? "bg-accent border-primary"
                : ""
            }`}
            onClick={() => onSelectPlaylist(playlist.id)}
          >
            <div className="flex items-center gap-3">
              {playlist.images && playlist.images.length > 0 ? (
                <Image
                  src={playlist.images[0].url}
                  alt={playlist.name}
                  width={64}
                  height={64}
                  className="rounded object-cover"
                />
              ) : (
                <div className="h-16 w-16 bg-muted rounded flex items-center justify-center">
                  <Music2 className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{playlist.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {playlist.tracks.total} spor
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}

