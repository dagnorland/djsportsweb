"use client";

/** Play / pause DJ tracks (djSports player or Spotify device); errors become toasts. */
import { useCallback } from "react";
import { useSession } from "next-auth/react";
import { playErrorMessage } from "@/lib/spotify/dj-client";
import * as playback from "@/lib/spotify/playback";
import { startPositionMs, type DJTrack } from "@/lib/types/djmodels";
import { showAppToast } from "@/lib/ui/app-toast";

export function useDJPlayer() {
  const { data: session } = useSession();
  const token = session?.accessToken;

  const guard = useCallback(async (fn: (t: string) => Promise<unknown>): Promise<boolean> => {
    if (!token) {
      showAppToast("Connect Spotify to play", { level: "warning" });
      return false;
    }
    try {
      await fn(token);
      return true;
    } catch (e) {
      showAppToast("Spotify did not start playback", { level: "error", description: playErrorMessage(e) });
      return false;
    }
  }, [token]);

  return {
    token,
    canPlay: !!token,
    /** Plays at the track's start position (startTime + startTimeMS) unless `atMs` is given. */
    play: (track: DJTrack, atMs?: number) => {
      // Synchronous, inside the click: lets the browser start audio.
      playback.prepareUserGesture();
      if (!track.spotifyUri) {
        showAppToast("This track has no Spotify URI", { level: "warning", description: "Apple Music playback is not available on the web." });
        return Promise.resolve(false);
      }
      return guard(t => playback.play(t, track.spotifyUri, atMs ?? startPositionMs(track)));
    },
    pause: () => guard(playback.pause),
    resume: () => { playback.prepareUserGesture(); return guard(playback.resume); },
  };
}
