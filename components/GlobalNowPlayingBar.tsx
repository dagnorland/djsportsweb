"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { getCurrentlyPlayingTrack, pausePlayback, startResumePlayback, skipToNext, skipToPrevious, setPlaybackVolume } from "@/lib/spotify";
import type { CurrentlyPlaying } from "@/lib/types";
import NowPlayingBar from "./NowPlayingBar";

export default function GlobalNowPlayingBar() {
  const { data: session } = useSession();
  const [nowPlaying, setNowPlaying] = useState<CurrentlyPlaying | null>(null);

  // Polling for now playing status
  useEffect(() => {
    if (!session?.accessToken) return;

    const updateNowPlaying = async () => {
      try {
        const data = await getCurrentlyPlayingTrack(session.accessToken!);
        setNowPlaying(data);
      } catch (error) {
        setNowPlaying(null);
      }
    };

    // Initial fetch
    updateNowPlaying();
    
    // Poll every 5 seconds
    const interval = setInterval(updateNowPlaying, 5000);
    return () => clearInterval(interval);
  }, [session?.accessToken]);

  const handlePlayPause = async () => {
    if (!session?.accessToken || !nowPlaying) return;

    try {
      if (nowPlaying.is_playing) {
        await pausePlayback(session.accessToken);
      } else {
        await startResumePlayback(session.accessToken);
      }
      // Update state immediately for better UX
      setNowPlaying(prev => prev ? { ...prev, is_playing: !prev.is_playing } : null);
    } catch (error) {
      console.error("Feil ved play/pause:", error);
    }
  };

  const handleNext = async () => {
    if (!session?.accessToken) return;

    try {
      await skipToNext(session.accessToken);
      // Refresh now playing after a short delay
      setTimeout(async () => {
        try {
          const data = await getCurrentlyPlayingTrack(session.accessToken!);
          setNowPlaying(data);
        } catch (error) {
          console.error("Feil ved oppdatering etter skip:", error);
        }
      }, 1000);
    } catch (error) {
      console.error("Feil ved skip til neste:", error);
    }
  };

  const handlePrevious = async () => {
    if (!session?.accessToken) return;

    try {
      await skipToPrevious(session.accessToken);
      // Refresh now playing after a short delay
      setTimeout(async () => {
        try {
          const data = await getCurrentlyPlayingTrack(session.accessToken!);
          setNowPlaying(data);
        } catch (error) {
          console.error("Feil ved oppdatering etter skip:", error);
        }
      }, 1000);
    } catch (error) {
      console.error("Feil ved skip til forrige:", error);
    }
  };

  const handleVolumeChange = async (volume: number) => {
    if (!session?.accessToken) return;

    try {
      await setPlaybackVolume(session.accessToken, volume);
    } catch (error) {
      console.error("Feil ved volumendring:", error);
    }
  };

  return (
    <NowPlayingBar
      currentlyPlaying={nowPlaying}
      onPlayPause={handlePlayPause}
      onNext={handleNext}
      onPrevious={handlePrevious}
      onVolumeChange={handleVolumeChange}
    />
  );
}
