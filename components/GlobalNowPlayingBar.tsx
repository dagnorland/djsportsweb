"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { getCurrentlyPlayingTrack, pausePlayback, startResumePlayback, skipToNext, skipToPrevious, setPlaybackVolume, getAvailableDevices } from "@/lib/spotify";
import type { CurrentlyPlaying } from "@/lib/types";
import NowPlayingBar from "./NowPlayingBar";
import { logger } from "@/lib/utils/logger";
import { useOptimizedPolling } from "@/lib/hooks/useOptimizedPolling";
import { usePollingSettings } from "@/lib/hooks/usePollingSettings";

export default function GlobalNowPlayingBar() {
  const { data: session } = useSession();
  const [nowPlaying, setNowPlaying] = useState<CurrentlyPlaying | null>(null);
  const { interval, setInterval } = usePollingSettings();

  // Optimized polling for now playing status
  const updateNowPlaying = async () => {
    if (!session?.accessToken) return;

    try {
      const data = await getCurrentlyPlayingTrack(session.accessToken);
      setNowPlaying(data);
    } catch (error) {
      setNowPlaying(null);
      throw error; // Re-throw for polling error handling
    }
  };

  useOptimizedPolling({
    enabled: !!session?.accessToken && interval > 0, // Disable if interval is 0 (Off)
    interval: interval > 0 ? interval : 3000, // Fallback to 3s if off
    maxInterval: 15000, // Max 15 seconds on errors
    onPoll: updateNowPlaying,
    onError: (error) => {
      logger.warn("Now playing polling error:", error);
    },
    name: "now-playing"
  });


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
      logger.error("Feil ved play/pause:", error);
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
          logger.error("Feil ved oppdatering etter skip:", error);
        }
      }, 1000);
    } catch (error) {
      logger.error("Feil ved skip til neste:", error);
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
          logger.error("Feil ved oppdatering etter skip:", error);
        }
      }, 1000);
    } catch (error) {
      logger.error("Feil ved skip til forrige:", error);
    }
  };

  const handleVolumeChange = async (volume: number) => {
    if (!session?.accessToken) return;

    try {
      await setPlaybackVolume(session.accessToken, volume);
    } catch (error) {
      logger.error("Feil ved volumendring:", error);
    }
  };

  const handleStartSpotify = async () => {
    if (!session?.accessToken) return;

    try {
      // Først prøv å starte avspilling på standard enhet
      await startResumePlayback(session.accessToken);
      
      // Sett polling interval til 5 sekunder for bedre responsivitet
      setInterval(5000);
      
      // Oppdater now playing status etter en kort delay
      setTimeout(async () => {
        try {
          const data = await getCurrentlyPlayingTrack(session.accessToken!);
          setNowPlaying(data);
        } catch (error) {
          logger.error("Feil ved oppdatering etter start av Spotify:", error);
        }
      }, 1000);
    } catch (error) {
      logger.error("Feil ved start av Spotify:", error);
      
      // Hvis det feiler, prøv å hente tilgjengelige enheter og start på første tilgjengelige
      try {
        const devices = await getAvailableDevices(session.accessToken);
        if (devices.length > 0) {
          const activeDevice = devices.find(device => device.is_active) || devices[0];
          if (activeDevice.id) {
            await startResumePlayback(session.accessToken, activeDevice.id);
          } else {
            logger.warn("Aktiv enhet har ikke gyldig ID");
            return;
          }
          
          // Sett polling interval til 5 sekunder for bedre responsivitet
          setInterval(5000);
          
          // Oppdater now playing status
          setTimeout(async () => {
            try {
              const data = await getCurrentlyPlayingTrack(session.accessToken!);
              setNowPlaying(data);
            } catch (error) {
              logger.error("Feil ved oppdatering etter start på spesifikk enhet:", error);
            }
          }, 1000);
        } else {
          logger.warn("Ingen tilgjengelige Spotify-enheter funnet");
        }
      } catch (deviceError) {
        logger.error("Feil ved henting av enheter:", deviceError);
      }
    }
  };


  return (
    <NowPlayingBar
      currentlyPlaying={nowPlaying}
      onPlayPause={handlePlayPause}
      onNext={handleNext}
      onPrevious={handlePrevious}
      onVolumeChange={handleVolumeChange}
      onStartSpotify={handleStartSpotify}
    />
  );
}
