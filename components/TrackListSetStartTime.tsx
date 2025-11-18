"use client";

import { PlaylistTrack } from "@/lib/types";
import { Music2, Clock, AlertTriangle } from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { 
  saveTrackStartTime, 
  loadTrackStartTimes 
} from "@/lib/utils/trackStartTimes";
import { isTrackUnavailable } from "@/lib/utils/trackAvailability";
import { Slider } from "@/components/ui/slider";

interface TrackListSetStartTimeProps {
  tracks: PlaylistTrack[];
  loading?: boolean;
  onPlayTrack?: (trackUri: string, position: number, startTime?: number) => void;
  onPauseTrack?: () => void;
  onNavigatePlaylist?: (direction: 'next' | 'previous') => void;
}

export default function TrackListSetStartTime({ tracks, loading = false, onPlayTrack, onPauseTrack, onNavigatePlaylist }: TrackListSetStartTimeProps) {
  const [tracksWithStartTimes, setTracksWithStartTimes] = useState<PlaylistTrack[]>([]);
  const [focusedTrackIndex, setFocusedTrackIndex] = useState<number>(0);
  const [isSliderFocused, setIsSliderFocused] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Load start times from localStorage when tracks change
  useEffect(() => {
    if (tracks.length > 0) {
      const tracksWithTimes = loadTrackStartTimes(tracks);
      setTracksWithStartTimes(tracksWithTimes);
      // Set focus on first track and slider when tracks load
      setFocusedTrackIndex(0);
      setIsSliderFocused(true);
    }
  }, [tracks]);

  // Focus the container when tracks change to ensure keyboard navigation works
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (tracks.length > 0 && containerRef.current) {
      // Small delay to ensure the component is fully rendered
      setTimeout(() => {
        containerRef.current?.focus();
        // Ensure the first track row is visually focused
        setFocusedTrackIndex(0);
        setIsSliderFocused(true);
      }, 100);
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

  const handleStartTimeChange = (trackId: string, newStartTime: number) => {
    saveTrackStartTime(trackId, newStartTime);
    
    // Update local state
    setTracksWithStartTimes(prev => 
      prev.map(track => 
        track.track?.id === trackId 
          ? { ...track, start_time_ms: newStartTime }
          : track
      )
    );

    // Auto-play the track from the new start time if it's the currently focused track
    const currentTrack = tracksWithStartTimes[focusedTrackIndex];
    if (currentTrack?.track?.id === trackId && currentTrack.track.uri) {
      // Don't auto-play if track is unavailable
      if (!isTrackUnavailable(currentTrack.track)) {
        onPlayTrack?.(currentTrack.track.uri, focusedTrackIndex, newStartTime > 0 ? newStartTime : undefined);
        setIsPlaying(true);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const currentTrack = tracksWithStartTimes[focusedTrackIndex];
    if (!currentTrack?.track?.id) return;

    const currentStartTime = currentTrack.start_time_ms || 0;
    const trackDuration = currentTrack.track.duration_ms;
    const stepSize = 1000; // 1 second

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = Math.min(focusedTrackIndex + 1, tracksWithStartTimes.length - 1);
      setFocusedTrackIndex(nextIndex);
      setIsSliderFocused(true); // Auto-focus slider when changing tracks
      setIsPlaying(false); // Stop player when changing tracks
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = Math.max(focusedTrackIndex - 1, 0);
      setFocusedTrackIndex(prevIndex);
      setIsSliderFocused(true); // Auto-focus slider when changing tracks
      setIsPlaying(false); // Stop player when changing tracks
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (isSliderFocused) {
        const newStartTime = Math.max(0, currentStartTime - stepSize);
        handleStartTimeChange(currentTrack.track.id, newStartTime);
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (isSliderFocused) {
        const newStartTime = Math.min(trackDuration, currentStartTime + stepSize);
        handleStartTimeChange(currentTrack.track.id, newStartTime);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      // Don't play if track is unavailable
      if (isTrackUnavailable(currentTrack.track)) return;
      
      // Toggle play/pause
      if (isPlaying) {
        // Pause if currently playing
        onPauseTrack?.();
        setIsPlaying(false);
      } else {
        // Play if not playing
        if (currentTrack.track.uri) {
          const startTime = currentTrack.start_time_ms || 0;
          onPlayTrack?.(currentTrack.track.uri, focusedTrackIndex, startTime > 0 ? startTime : undefined);
          setIsPlaying(true);
        }
      }
    } else if (e.key === ' ') {
      e.preventDefault();
      // Don't play if track is unavailable
      if (isTrackUnavailable(currentTrack.track)) return;
      
      if (currentTrack.track.uri) {
        const startTime = currentTrack.start_time_ms || 0;
        onPlayTrack?.(currentTrack.track.uri, focusedTrackIndex, startTime > 0 ? startTime : undefined);
        setIsPlaying(true);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      setIsSliderFocused(!isSliderFocused);
    } else if (e.key === 'PageDown' || (e.key === 'ArrowRight' && e.ctrlKey)) {
      e.preventDefault();
      onNavigatePlaylist?.('next');
    } else if (e.key === 'PageUp' || (e.key === 'ArrowLeft' && e.ctrlKey)) {
      e.preventDefault();
      onNavigatePlaylist?.('previous');
    }
  };

  // Focus management
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        setIsSliderFocused(true);
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
            <div className="h-12 w-12 bg-muted rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-3 bg-muted rounded w-1/4" />
            </div>
            <div className="w-32 h-2 bg-muted rounded" />
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
    <div 
      ref={containerRef}
      className="space-y-2 focus:outline-none" 
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {tracksWithStartTimes.map((item, index) => {
        const track = item.track;
        if (!track) return null;

        // Type guard to check if it's a Track (not Episode)
        const isTrack = "album" in track;
        const trackId = track.id;
        const startTime = item.start_time_ms || 0;
        const isFocused = focusedTrackIndex === index;
        const isUnavailable = isTrackUnavailable(track);

        return (
          <div
            key={track.id || index}
            className={`flex items-center gap-4 p-4 rounded-lg border transition-all cursor-pointer group ${
              isFocused 
                ? 'bg-accent border-primary/50 shadow-lg ring-1 ring-primary/20' 
                : 'hover:bg-accent/50 border-transparent'
            } ${isUnavailable ? 'opacity-60' : ''}`}
            onClick={() => {
              setFocusedTrackIndex(index);
              setIsSliderFocused(true); // Auto-focus slider when clicking track
              if (!isUnavailable && track.uri) {
                onPlayTrack?.(track.uri, index, startTime > 0 ? startTime : undefined);
                // Toggle play state when clicking
                setIsPlaying(!isPlaying);
              }
            }}
          >
            {/* Track Number */}
            <div className="w-8 text-center text-sm font-medium text-muted-foreground">
              {index + 1}
            </div>

            {/* Track Image */}
            <div className="flex-shrink-0">
              {isTrack && track.album?.images && track.album.images.length > 0 ? (
                <Image
                  src={track.album.images[track.album.images.length - 1].url}
                  alt={track.name}
                  width={48}
                  height={48}
                  className="rounded"
                />
              ) : (
                <div className="h-12 w-12 bg-muted rounded flex items-center justify-center">
                  <Music2 className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Track Title */}
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <p className="font-medium truncate text-sm">{track.name}</p>
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

            {/* Start Time Slider */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="text-xs text-muted-foreground min-w-0">
                {formatStartTime(startTime)}
              </div>
              <div 
                ref={isFocused ? sliderRef : null}
                className={`w-80 ${isFocused && isSliderFocused ? 'ring-2 ring-primary ring-offset-2 rounded' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSliderFocused(true);
                }}
              >
                <Slider
                  value={[startTime]}
                  onValueChange={(value) => handleStartTimeChange(trackId, value[0])}
                  max={track.duration_ms}
                  step={1000}
                  className="w-full"
                />
              </div>
              <div className="text-xs text-muted-foreground min-w-0">
                {formatDuration(track.duration_ms)}
              </div>
            </div>
          </div>
        );
      })}
      
      {/* Instructions */}
      <div className="mt-4 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
        <p><strong>Navigasjon:</strong> Piltaster opp/ned for å velge spor (stopper avspilling og fokuserer slider)</p>
        <p><strong>Starttid:</strong> Venstre/høyre piltaster for å justere starttid og spille automatisk</p>
        <p><strong>Avspilling:</strong> Enter for å spille/stoppe (toggle), Space for å spille</p>
        <p><strong>Slider:</strong> Tab for å bytte slider-fokus</p>
        <p><strong>Spillelister:</strong> PageDown/Ctrl+→ for neste, PageUp/Ctrl+← for forrige</p>
      </div>
    </div>
  );
}
