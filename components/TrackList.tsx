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
import { Music2, Clock, Edit3, Check, X } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { 
  saveTrackStartTime, 
  getTrackStartTime, 
  loadTrackStartTimes 
} from "@/lib/utils/trackStartTimes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TrackListProps {
  tracks: PlaylistTrack[];
  loading?: boolean;
  onPlayTrack?: (trackUri: string, position: number, startTime?: number) => void;
}

export default function TrackList({ tracks, loading = false, onPlayTrack }: TrackListProps) {
  const [tracksWithStartTimes, setTracksWithStartTimes] = useState<PlaylistTrack[]>([]);
  const [editingTrack, setEditingTrack] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  // Load start times from localStorage when tracks change
  useEffect(() => {
    if (tracks.length > 0) {
      const tracksWithTimes = loadTrackStartTimes(tracks);
      setTracksWithStartTimes(tracksWithTimes);
    }
  }, [tracks]);

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const formatStartTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const parseStartTime = (timeString: string): number => {
    const parts = timeString.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0], 10);
      const seconds = parseInt(parts[1], 10);
      if (!isNaN(minutes) && !isNaN(seconds)) {
        return minutes * 60000 + seconds * 1000;
      }
    }
    return 0;
  };

  const handleEditStartTime = (trackId: string, currentStartTime: number) => {
    setEditingTrack(trackId);
    setEditValue(formatStartTime(currentStartTime));
  };

  const handleSaveStartTime = (trackId: string) => {
    const startTimeMs = parseStartTime(editValue);
    saveTrackStartTime(trackId, startTimeMs);
    
    // Update local state
    setTracksWithStartTimes(prev => 
      prev.map(track => 
        track.track?.id === trackId 
          ? { ...track, start_time_ms: startTimeMs }
          : track
      )
    );
    
    setEditingTrack(null);
    setEditValue("");
  };

  const handleCancelEdit = () => {
    setEditingTrack(null);
    setEditValue("");
  };

  const handleRemoveStartTime = (trackId: string) => {
    saveTrackStartTime(trackId, 0);
    
    // Update local state
    setTracksWithStartTimes(prev => 
      prev.map(track => 
        track.track?.id === trackId 
          ? { ...track, start_time_ms: undefined }
          : track
      )
    );
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

  if (tracksWithStartTimes.length === 0) {
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
          <TableHead className="text-center">
            <Clock className="h-4 w-4 inline" />
          </TableHead>
          <TableHead>Artist</TableHead>
          <TableHead>Album</TableHead>
          <TableHead className="text-right">Starttid</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tracksWithStartTimes.map((item, index) => {
          const track = item.track;
          if (!track) return null;

          // Type guard to check if it's a Track (not Episode)
          const isTrack = "album" in track;
          const trackId = track.id;
          const startTime = item.start_time_ms || 0;

          return (
            <TableRow 
              key={track.id || index} 
              className="hover:bg-accent/50 cursor-pointer group"
              onClick={() => onPlayTrack?.(track.uri, index, startTime > 0 ? startTime : undefined)}
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
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  {editingTrack === trackId ? (
                    <div className="flex items-center gap-1">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="mm:ss"
                        className="w-20 h-8 text-sm"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveStartTime(trackId);
                        }}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelEdit();
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground text-sm">
                        {startTime > 0 ? formatStartTime(startTime) : "0:00"}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditStartTime(trackId, startTime);
                        }}
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </TableCell>              
              <TableCell className="text-right text-muted-foreground">
                {formatDuration(track.duration_ms)}
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

            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

