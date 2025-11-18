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
import { Music2, Clock, Edit3, Check, X, AlertTriangle } from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { 
  saveTrackStartTime, 
  getTrackStartTime, 
  loadTrackStartTimes 
} from "@/lib/utils/trackStartTimes";
import { isTrackUnavailable } from "@/lib/utils/trackAvailability";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { logger } from "@/lib/utils/logger";

interface TrackListProps {
  tracks: PlaylistTrack[];
  loading?: boolean;
  onPlayTrack?: (trackUri: string, position: number, startTime?: number) => void;
}

export default function TrackList({ tracks, loading = false, onPlayTrack }: TrackListProps) {
  const [tracksWithStartTimes, setTracksWithStartTimes] = useState<PlaylistTrack[]>([]);
  const [editingTrack, setEditingTrack] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [focusedTrackIndex, setFocusedTrackIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load start times from localStorage when tracks change
  useEffect(() => {
    if (tracks.length > 0) {
      const tracksWithTimes = loadTrackStartTimes(tracks);
      setTracksWithStartTimes(tracksWithTimes);
    }
  }, [tracks]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingTrack && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingTrack]);

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

  const handleKeyDown = (e: React.KeyboardEvent, trackIndex: number) => {
    if (e.key === 'Enter' && !editingTrack) {
      const track = tracksWithStartTimes[trackIndex];
      if (track?.track?.id) {
        const startTime = track.start_time_ms || 0;
        handleEditStartTime(track.track.id, startTime);
        setFocusedTrackIndex(trackIndex);
      }
    } else if (e.key === 'ArrowDown' && !editingTrack) {
      e.preventDefault();
      const nextIndex = Math.min(trackIndex + 1, tracksWithStartTimes.length - 1);
      setFocusedTrackIndex(nextIndex);
    } else if (e.key === 'ArrowUp' && !editingTrack) {
      e.preventDefault();
      const prevIndex = Math.max(trackIndex - 1, 0);
      setFocusedTrackIndex(prevIndex);
    } else if (e.key === 'Escape' && editingTrack) {
      handleCancelEdit();
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (editingTrack) {
        handleSaveStartTime(editingTrack);
        // Move to next track after saving
        const currentIndex = tracksWithStartTimes.findIndex(track => track.track?.id === editingTrack);
        if (currentIndex < tracksWithStartTimes.length - 1) {
          const nextTrack = tracksWithStartTimes[currentIndex + 1];
          if (nextTrack?.track?.id) {
            const nextStartTime = nextTrack.start_time_ms || 0;
            handleEditStartTime(nextTrack.track.id, nextStartTime);
            setFocusedTrackIndex(currentIndex + 1);
          }
        } else {
          setFocusedTrackIndex(-1);
        }
      }
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (editingTrack) {
        handleSaveStartTime(editingTrack);
        const currentIndex = tracksWithStartTimes.findIndex(track => track.track?.id === editingTrack);
        if (currentIndex < tracksWithStartTimes.length - 1) {
          const nextTrack = tracksWithStartTimes[currentIndex + 1];
          if (nextTrack?.track?.id) {
            const nextStartTime = nextTrack.start_time_ms || 0;
            handleEditStartTime(nextTrack.track.id, nextStartTime);
            setFocusedTrackIndex(currentIndex + 1);
          }
        }
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (editingTrack) {
        handleSaveStartTime(editingTrack);
        const currentIndex = tracksWithStartTimes.findIndex(track => track.track?.id === editingTrack);
        if (currentIndex > 0) {
          const prevTrack = tracksWithStartTimes[currentIndex - 1];
          if (prevTrack?.track?.id) {
            const prevStartTime = prevTrack.start_time_ms || 0;
            handleEditStartTime(prevTrack.track.id, prevStartTime);
            setFocusedTrackIndex(currentIndex - 1);
          }
        }
      }
    }
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
    setFocusedTrackIndex(-1);
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
          <TableHead className="text-cente">Starttid</TableHead>
          <TableHead className="text-center">
            <Clock className="h-4 w-4 inline" />
          </TableHead>
          <TableHead>Artist</TableHead>
          <TableHead>Album</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tracksWithStartTimes.map((item, index) => {
          // Logger i dev-mode (bruker logger.debug som er aktivert i dev)
          if (index == 0) {
            logger.debug('TrackList: item', JSON.stringify(item, null, 2));
          }
    
          const track = item.track;
          if (!track) return null;

          // Type guard to check if it's a Track (not Episode)
          const isTrack = "album" in track;
          const trackId = track.id;
          const startTime = item.start_time_ms || 0;
          const isUnavailable = isTrackUnavailable(track);

          return (
            <TableRow 
              key={track.id || index} 
              className={`hover:bg-accent/50 cursor-pointer group ${
                focusedTrackIndex === index ? 'bg-accent/30' : ''
              } ${isUnavailable ? 'opacity-60' : ''}`}
              onClick={() => !isUnavailable && onPlayTrack?.(track.uri, index, startTime > 0 ? startTime : undefined)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              tabIndex={0}
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
                  <div className="min-w-0 flex items-center gap-2">
                    <p className="font-medium truncate">{track.name}</p>
                    {isUnavailable && (
                      <AlertTriangle 
                        className="h-4 w-4 text-yellow-500 flex-shrink-0" 
                        aria-label="Spor er ikke tilgjengelig"
                      />
                    )}
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
                        ref={inputRef}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleInputKeyDown}
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
                      <span className={`text-sm px-2 py-1 rounded ${
                        startTime > 0 
                          ? "bg-foreground text-background" 
                          : "text-muted-foreground"
                      }`}>
                        {startTime > 0 ? formatStartTime(startTime) : "0:00"}
                      </span>                      <Button
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
                  {isTrack && track.artists?.map((artist: { id: string; name: string }, i: number) => (
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

