"use client";

import { CurrentlyPlaying } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Music2,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

interface NowPlayingBarProps {
  currentlyPlaying: CurrentlyPlaying | null;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onVolumeChange: (volume: number) => void;
}

export default function NowPlayingBar({
  currentlyPlaying,
  onPlayPause,
  onNext,
  onPrevious,
  onVolumeChange,
}: NowPlayingBarProps) {
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(50);

  useEffect(() => {
    if (currentlyPlaying?.progress_ms && currentlyPlaying?.item?.duration_ms) {
      const percentage =
        (currentlyPlaying.progress_ms / currentlyPlaying.item.duration_ms) * 100;
      setProgress(percentage);
    }
  }, [currentlyPlaying]);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    onVolumeChange(newVolume);
  };

  if (!currentlyPlaying?.item) {
    return (
      <div className="h-24 px-4 flex items-center justify-center bg-muted/30">
        <p className="text-sm text-muted-foreground">
          Ingen sang spilles for øyeblikket
        </p>
      </div>
    );
  }

  const track = currentlyPlaying.item;
  const isPlaying = currentlyPlaying.is_playing;

  return (
    <div className="h-24 px-4 flex items-center gap-4 bg-background">
      {/* Track info */}
      <div className="flex items-center gap-3 w-80 min-w-0">
        {track.album?.images && track.album.images.length > 0 ? (
          <Image
            src={track.album.images[track.album.images.length - 1].url}
            alt={track.name}
            width={56}
            height={56}
            className="rounded"
          />
        ) : (
          <div className="h-14 w-14 bg-muted rounded flex items-center justify-center flex-shrink-0">
            <Music2 className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">{track.name}</p>
          <p className="text-sm text-muted-foreground truncate">
            {track.artists?.map((artist) => artist.name).join(", ")}
          </p>
        </div>
      </div>

      {/* Player controls */}
      <div className="flex-1 flex flex-col items-center gap-2 max-w-2xl mx-auto">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onPrevious}
            className="h-8 w-8"
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button
            variant="default"
            size="icon"
            onClick={onPlayPause}
            className="h-10 w-10"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNext}
            className="h-8 w-8"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress bar */}
        <div className="w-full flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-10 text-right">
            {formatTime(currentlyPlaying.progress_ms || 0)}
          </span>
          <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground w-10">
            {formatTime(track.duration_ms)}
          </span>
        </div>
      </div>

      {/* Volume control */}
      <div className="flex items-center gap-2 w-40">
        <Volume2 className="h-4 w-4 text-muted-foreground" />
        <Slider
          value={[volume]}
          onValueChange={handleVolumeChange}
          max={100}
          step={1}
          className="flex-1"
        />
      </div>
    </div>
  );
}

