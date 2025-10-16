"use client";

import { useState, useEffect } from "react";
import { PlaylistTrack, SimplifiedPlaylist } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, SkipForward, SkipBack } from "lucide-react";
import Image from "next/image";
import { Music2 } from "lucide-react";
import { getPlaylistType } from "@/lib/utils/playlistTypes";
import { loadTrackStartTimes } from "@/lib/utils/trackStartTimes";

interface PlaylistCarouselProps {
  playlist: SimplifiedPlaylist;
  tracks: PlaylistTrack[];
  onPlayTrack?: (trackUri: string, position: number, startTime?: number) => void;
  isPlaying?: boolean;
  currentTrackUri?: string;
}

export default function PlaylistCarousel({ 
  playlist, 
  tracks, 
  onPlayTrack,
  isPlaying = false,
  currentTrackUri
}: PlaylistCarouselProps) {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [playlistType, setPlaylistType] = useState<string>("none");
  const [tracksWithStartTimes, setTracksWithStartTimes] = useState<PlaylistTrack[]>([]);

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
    }
  }, [tracks]);

  const currentTrack = tracksWithStartTimes[currentTrackIndex];
  if (!currentTrack?.track) return null;

  const track = currentTrack.track;
  const isTrack = "album" in track;
  const startTime = currentTrack.start_time_ms || 0;

  const handlePlay = () => {
    if (onPlayTrack && track) {
      onPlayTrack(track.uri, currentTrackIndex, startTime > 0 ? startTime : undefined);
    }
  };

  const handleNext = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % tracks.length);
  };

  const handlePrevious = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
  };


  const formatStartTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const getPlaylistTypeColor = (type: string) => {
    switch (type) {
      case "hotspot": return "bg-red-500";
      case "match": return "bg-blue-500";
      case "funStuff": return "bg-green-500";
      case "preMatch": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };

  const getPlaylistTypeLabel = (type: string) => {
    switch (type) {
      case "hotspot": return "Hotspot";
      case "match": return "Match";
      case "funStuff": return "Fun Stuff";
      case "preMatch": return "Pre Match";
      default: return "Ingen";
    }
  };

  return (
    <Card className="w-full max-w-48 mx-auto">
      <CardContent className="p-2">
        {/* Playlist header */}
        <div className="mb-2">
          <h3 className="font-semibold truncate text-xs">{playlist.name}</h3>
          {/* Color line for playlist type */}
          <div className={`h-1 w-full rounded-full mt-1 ${getPlaylistTypeColor(playlistType)}`}></div>
        </div>

        {/* Current track display */}
        <div className="space-y-2">
          {/* Track image with navigation and play button */}
          <div className="flex items-center justify-center space-x-1">
            {/* Previous button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={tracks.length <= 1}
              className="h-6 w-6 p-0"
            >
              <SkipBack className="h-3 w-3" />
            </Button>
            
            {/* Track image with play button overlay */}
            <div className="relative aspect-square w-2/3 group">
              {isTrack && track.album?.images && track.album.images.length > 0 ? (
                <Image
                  src={track.album.images[track.album.images.length - 1].url}
                  alt={track.name}
                  fill
                  className="object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                  <Music2 className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              
              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Button
                  size="lg"
                  onClick={handlePlay}
                  className="rounded-full h-12 w-12 p-0 bg-black/50 hover:bg-black/70 border-0 shadow-lg"
                >
                  {isPlaying && currentTrackUri === track.uri ? (
                    <Pause className="h-6 w-6 text-white" />
                  ) : (
                    <Play className="h-6 w-6 text-white" />
                  )}
                </Button>
              </div>
            </div>
            
            {/* Next button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={tracks.length <= 1}
              className="h-6 w-6 p-0"
            >
              <SkipForward className="h-3 w-3" />
            </Button>
          </div>

          {/* Track info */}
          <div className="text-center space-y-0.5">
            <h4 className="font-medium truncate text-xs">{track.name}</h4>
            {isTrack && track.artists && (
              <p className="text-xs text-muted-foreground truncate">
                {track.artists.map(artist => artist.name).join(", ")}
              </p>
            )}
            {startTime > 0 && (
              <p className="text-xs text-muted-foreground">
                {formatStartTime(startTime)}
              </p>
            )}
          </div>



          {/* Track counter */}
          <div className="text-center text-xs text-muted-foreground">
            {currentTrackIndex + 1} av {tracks.length}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
