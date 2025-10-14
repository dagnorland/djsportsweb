"use client";

import { PlaylistTrack } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Music2, Clock } from "lucide-react";
import Image from "next/image";

interface TrackListProps {
  tracks: PlaylistTrack[];
  loading?: boolean;
  onPlayTrack?: (trackUri: string, position: number) => void;
}

export default function TrackList({ tracks, loading = false, onPlayTrack }: TrackListProps) {
  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
            <div className="h-10 w-10 bg-muted rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-3 bg-muted rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Music2 className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Ingen spor funnet</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">#</TableHead>
          <TableHead>Tittel</TableHead>
          <TableHead>Artist</TableHead>
          <TableHead>Album</TableHead>
          <TableHead className="text-right">
            <Clock className="h-4 w-4 inline" />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tracks.map((item, index) => {
          const track = item.track;
          if (!track) return null;

          // Type guard to check if it's a Track (not Episode)
          const isTrack = "album" in track;

          return (
            <TableRow 
              key={track.id || index} 
              className="hover:bg-accent/50 cursor-pointer"
              onClick={() => onPlayTrack?.(track.uri, index)}
            >
              <TableCell className="font-medium text-muted-foreground">
                {index + 1}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  {isTrack && track.album?.images && track.album.images.length > 0 ? (
                    <Image
                      src={track.album.images[track.album.images.length - 1].url}
                      alt={track.name}
                      width={40}
                      height={40}
                      className="rounded"
                    />
                  ) : (
                    <div className="h-10 w-10 bg-muted rounded flex items-center justify-center">
                      <Music2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium truncate">{track.name}</p>
                    {track.explicit && (
                      <span className="text-xs bg-muted px-1 rounded text-muted-foreground">
                        E
                      </span>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="truncate">
                  {isTrack && track.artists?.map((artist: any, i: number) => (
                    <span key={artist.id}>
                      {i > 0 && ", "}
                      {artist.name}
                    </span>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <div className="truncate">{isTrack && track.album?.name}</div>
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {formatDuration(track.duration_ms)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

