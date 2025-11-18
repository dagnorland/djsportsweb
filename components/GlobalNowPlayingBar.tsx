"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { getCurrentlyPlayingTrack, pausePlayback, startResumePlayback, skipToNext, skipToPrevious, setPlaybackVolume, getAvailableDevices } from "@/lib/spotify";
import type { CurrentlyPlaying } from "@/lib/types";
import NowPlayingBar from "./NowPlayingBar";
import FloatingPauseButton from "./FloatingPauseButton";
import { logger } from "@/lib/utils/logger";
import { useOptimizedPolling } from "@/lib/hooks/useOptimizedPolling";
import { usePollingSettings } from "@/lib/hooks/usePollingSettings";
import { getCachedDevice, findAndCacheMacDevice } from "@/lib/utils/deviceCache";

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

  // Always enable polling, but use minimum 3s interval if user set it to 0
  useOptimizedPolling({
    enabled: !!session?.accessToken, // Always enabled if we have a session
    interval: interval > 0 ? interval : 3000, // Minimum 3s if user set to 0
    maxInterval: 15000, // Max 15 seconds on errors
    onPoll: updateNowPlaying,
    onError: (error) => {
      logger.warn("Now playing polling error:", error);
    },
    name: "now-playing"
  });

  // Also do an initial fetch when session becomes available
  useEffect(() => {
    if (session?.accessToken) {
      updateNowPlaying();
    }
  }, [session?.accessToken]);

  const handlePlayPause = useCallback(async () => {
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
  }, [session?.accessToken, nowPlaying]);

  // ESC-tastatursnarvei for pause
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Pauser kun hvis ESC trykkes og musikk spiller
      if (event.key === "Escape" && nowPlaying?.is_playing) {
        // Unngå konflikt med eksisterende handlers (f.eks. i input-felter eller dialogs)
        const target = event.target as HTMLElement;
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable ||
          target.closest("[role='dialog']")
        ) {
          return;
        }

        event.preventDefault();
        handlePlayPause();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nowPlaying?.is_playing, handlePlayPause]);

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
      // Use cached device ID for faster start
      const cachedDevice = getCachedDevice();
      const deviceId = cachedDevice?.id;
      
      // Start playback on cached device (or default if no cache)
      await startResumePlayback(session.accessToken, deviceId);
      
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
          // Cache the device for next time
          const deviceId = findAndCacheMacDevice(devices);
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
    <>
      <NowPlayingBar
        currentlyPlaying={nowPlaying}
        onPlayPause={handlePlayPause}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onVolumeChange={handleVolumeChange}
        onStartSpotify={handleStartSpotify}
      />
      <FloatingPauseButton
        currentlyPlaying={nowPlaying}
        onPlayPause={handlePlayPause}
      />
    </>
  );
}
