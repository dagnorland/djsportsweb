"use client";

import { useState, useEffect, memo, useMemo, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { PlaylistTrack, SimplifiedPlaylist } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipForward, SkipBack, AlertTriangle } from "lucide-react";
import Image from "next/image";
import { Music2 } from "lucide-react";
import { getPlaylistType } from "@/lib/utils/playlistTypes";
import { loadTrackStartTimes } from "@/lib/utils/trackStartTimes";
import { logger } from "@/lib/utils/logger";
import { isTrackUnavailable } from "@/lib/utils/trackAvailability";

interface PlaylistCarouselProps {
  playlist: SimplifiedPlaylist;
  tracks: PlaylistTrack[];
  onPlayTrack?: (trackUri: string, position: number, startTime?: number) => void;
  isPlaying?: boolean;
  currentTrackUri?: string;
  shouldAutoAdvance?: boolean;
  onAutoAdvance?: () => void;
}

const PlaylistCarousel = memo(function PlaylistCarousel({ 
  playlist, 
  tracks, 
  onPlayTrack,
  isPlaying = false,
  currentTrackUri,
  shouldAutoAdvance = false,
  onAutoAdvance
}: PlaylistCarouselProps) {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [playlistType, setPlaylistType] = useState<string>("none");
  const [tracksWithStartTimes, setTracksWithStartTimes] = useState<PlaylistTrack[]>([]);
  const [floatingImage, setFloatingImage] = useState<{ src: string; alt: string; startX: number; startY: number } | null>(null);
  const imageRef = useRef<HTMLDivElement>(null);


  // Load playlist type from localStorage
  useEffect(() => {
    const type = getPlaylistType(playlist.id);
    setPlaylistType(type || "none");
  }, [playlist.id]);

  // Load start times from localStorage when tracks change
  useEffect(() => {
    if (tracks.length > 0) {
      const tracksWithTimes = loadTrackStartTimes(tracks);
      setTracksWithStartTimes(tracksWithTimes);
      // Reset current track index when tracks change
      setCurrentTrackIndex(0);
    }
  }, [tracks]);

  // Note: Auto-advancement is now handled directly in handlePlay after animation
  // The shouldAutoAdvance prop is kept for backwards compatibility but not used here

  const formatStartTime = useCallback((ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, []);

  const getPlaylistTypeColor = useCallback((type: string) => {
    switch (type) {
      case "hotspot": return "bg-red-500";
      case "match": return "bg-blue-500";
      case "funStuff": return "bg-green-500";
      case "preMatch": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  }, []);

  const getPlaylistTypeLabel = useCallback((type: string) => {
    switch (type) {
      case "hotspot": return "Hotspot";
      case "match": return "Match";
      case "funStuff": return "Fun Stuff";
      case "preMatch": return "Pre Match";
      default: return "Ingen";
    }
  }, []);

  const handlePlay = useCallback(() => {
    const currentTrack = tracksWithStartTimes[currentTrackIndex] || tracks[currentTrackIndex];
    if (!currentTrack?.track) return;
    
    const track = currentTrack.track;
    const startTime = currentTrack.start_time_ms || 0;
    const isTrackType = track && "album" in track;
    
    // Don't play if track is unavailable
    if (isTrackUnavailable(track)) return;
    
    // Start floating animation
    if (imageRef.current && isTrackType && track.album?.images && track.album.images.length > 0) {
      const rect = imageRef.current.getBoundingClientRect();
      const nowPlayingBar = document.querySelector('[data-now-playing-bar]') as HTMLElement;
      
      if (nowPlayingBar) {
        const targetRect = nowPlayingBar.getBoundingClientRect();
        const startX = rect.left + rect.width / 2;
        const startY = rect.top + rect.height / 2;
        const targetX = targetRect.left + 28 - startX; // 28px is half of 56px image width
        const targetY = targetRect.top + 28 - startY; // 28px is half of 56px image height
        
        setFloatingImage({
          src: track.album.images[0].url,
          alt: track.name || "Ukjent spor",
          startX: startX,
          startY: startY,
        });
        
        // Set CSS variables for animation
        document.documentElement.style.setProperty('--target-x', `${targetX}px`);
        document.documentElement.style.setProperty('--target-y', `${targetY}px`);
        
        // Remove floating image after animation
        setTimeout(() => {
          setFloatingImage(null);
        }, 1200);
      } else {
        // Fallback: animate to bottom left corner
        const startX = rect.left + rect.width / 2;
        const startY = rect.top + rect.height / 2;
        const targetX = 28 - startX; // Bottom left corner
        const targetY = window.innerHeight - 28 - startY;
        
        setFloatingImage({
          src: track.album.images[0].url,
          alt: track.name || "Ukjent spor",
          startX: startX,
          startY: startY,
        });
        
        document.documentElement.style.setProperty('--target-x', `${targetX}px`);
        document.documentElement.style.setProperty('--target-y', `${targetY}px`);
        
        setTimeout(() => {
          setFloatingImage(null);
        }, 1200);
      }
    }
    
    if (onPlayTrack && track) {
      onPlayTrack(track.uri, currentTrackIndex, startTime > 0 ? startTime : undefined);
      
      // Auto-advance to next track after animation completes (animation is 1.2s, wait 1400ms to be safe)
      const availableTracks = tracksWithStartTimes.length > 0 ? tracksWithStartTimes : tracks;
      const trackCount = availableTracks.length;
      
      if (trackCount > 1) {
        setTimeout(() => {
          setCurrentTrackIndex((prev) => (prev + 1) % trackCount);
        }, 1400); // Wait for animation to complete (1.2s animation + buffer)
      }
    }
  }, [onPlayTrack, currentTrackIndex, tracksWithStartTimes, tracks]);

  const handleNext = useCallback(() => {
    const availableTracks = tracksWithStartTimes.length > 0 ? tracksWithStartTimes : tracks;
    const trackCount = availableTracks.length;
    
    if (trackCount > 0) {
      setCurrentTrackIndex((prev) => (prev + 1) % trackCount);
    }
  }, [tracksWithStartTimes.length, tracks.length]);

  const handlePrevious = useCallback(() => {
    const availableTracks = tracksWithStartTimes.length > 0 ? tracksWithStartTimes : tracks;
    const trackCount = availableTracks.length;
    
    if (trackCount > 0) {
      const newIndex = (currentTrackIndex - 1 + trackCount) % trackCount;
      setCurrentTrackIndex(newIndex);
    }
  }, [tracksWithStartTimes.length, tracks.length, currentTrackIndex]);

  // Memoize expensive computations
  const playlistTypeColor = useMemo(() => getPlaylistTypeColor(playlistType), [playlistType, getPlaylistTypeColor]);

  const currentTrack = tracksWithStartTimes[currentTrackIndex] || tracks[currentTrackIndex];
  const track = currentTrack?.track;
  const isTrack = track && "album" in track;
  const startTime = currentTrack?.start_time_ms || 0;
  const isUnavailable = useMemo(() => isTrackUnavailable(track), [track]);
  
  const formattedStartTime = useMemo(() => formatStartTime(startTime), [startTime, formatStartTime]);
  const isCurrentTrackPlaying = useMemo(() => isPlaying && currentTrackUri === track?.uri, [isPlaying, currentTrackUri, track?.uri]);


  if (!currentTrack?.track) return null;

  return (
    <Card className="w-full h-full">
      <CardContent className="p-4">
        {/* Playlist header */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold truncate text-sm flex-1">{playlist.name}</h3>
            <span className="text-sm text-muted-foreground ml-2 flex-shrink-0">
              {currentTrackIndex + 1}/{tracksWithStartTimes.length > 0 ? tracksWithStartTimes.length : tracks.length}
            </span>
          </div>
          {/* Color line for playlist type */}
          <div className={`h-1 w-full rounded-full ${playlistTypeColor}`}></div>
        </div>

        {/* Current track display */}
        <div className="space-y-4">
          {/* Track image with navigation and play button */}
          <div className="grid grid-cols-[auto_1fr_auto] gap-1 items-center justify-items-center w-full">
            {/* Previous button */}
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={(tracksWithStartTimes.length > 0 ? tracksWithStartTimes.length : tracks.length) <= 1}
              className="w-10 h-full p-0 relative z-10"
              style={{ pointerEvents: 'auto' }}
            >
              <SkipBack className="h-5 w-5" />
            </Button>

            {/* Track image with play button overlay */}
            <div className="relative aspect-square w-full max-w-48 group">
              <div 
                ref={imageRef}
                className={`w-full h-full rounded-lg overflow-hidden ${
                  isCurrentTrackPlaying ? 'animate-pulse-scale ring-2 ring-primary/50 shadow-lg shadow-primary/30' : ''
                }`}
              >
                {isTrack && track.album?.images && track.album.images.length > 0 ? (
                  <Image
                    src={track.album.images[0].url}
                    alt={track?.name || "Ukjent spor"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    priority
                  />
                ) : (
                  <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                    <Music2 className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Start time chip */}
              <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm z-10 ${
                startTime > 0
                  ? 'bg-primary text-primary-foreground shadow-lg border-2 border-primary-foreground/20'
                  : 'bg-black/30 text-white/60'
              }`}>
                {formattedStartTime}
              </div>

              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <Button
                  size="lg"
                  onClick={handlePlay}
                  disabled={isUnavailable}
                  className="rounded-full h-20 w-20 p-0 bg-black/50 hover:bg-black/70 border-0 shadow-lg pointer-events-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCurrentTrackPlaying ? (
                    <Pause className="h-10 w-10 text-white" />
                  ) : (
                    <Play className="h-10 w-10 text-white" />
                  )}
                </Button>
              </div>
            </div>
            
            {/* Next button */}
            <Button
              variant="outline"
              onClick={handleNext}
              disabled={(tracksWithStartTimes.length > 0 ? tracksWithStartTimes.length : tracks.length) <= 1}
              className="w-10 h-full p-0 relative z-10"
              style={{ pointerEvents: 'auto' }}
            >
              <SkipForward className="h-5 w-5" />
            </Button>
          </div>

          {/* Track info */}
          <div className="text-center space-y-0.5">
            <div className="flex items-center justify-center gap-2">
              <h4 className="font-medium truncate text-sm">{track?.name || "Ukjent spor"}</h4>
              {isUnavailable && (
                <span title="Spor er ikke tilgjengelig">
                  <AlertTriangle 
                    className="h-4 w-4 text-yellow-500 flex-shrink-0" 
                  />
                </span>
              )}
            </div>
            {isTrack && track?.artists && (
              <p className="text-sm text-muted-foreground truncate">
                {track?.artists?.map(artist => artist.name).join(", ") || "Ukjent artist"}
              </p>
            )}
          </div>
        </div>
      </CardContent>
      
      {/* Floating image animation */}
      {floatingImage && typeof window !== 'undefined' && createPortal(
        <div
          className="fixed animate-float-to-now-playing rounded-lg overflow-hidden shadow-2xl ring-2 ring-primary/30"
          style={{
            left: `${floatingImage.startX}px`,
            top: `${floatingImage.startY}px`,
            width: '192px',
            height: '192px',
          }}
        >
          <Image
            src={floatingImage.src}
            alt={floatingImage.alt}
            fill
            className="object-cover"
            sizes="192px"
          />
        </div>,
        document.body
      )}
    </Card>
  );
});

export default PlaylistCarousel;
