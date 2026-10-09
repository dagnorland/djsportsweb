"use client";

/**
 * Starts the djSports player (Web Playback SDK) when logged in to Spotify
 * and "This browser plays through" is the djSports player (default).
 */
import { useEffect } from "react";
import { getSession, useSession } from "next-auth/react";
import { getDb } from "@/lib/db/djsports-db";
import { useLive } from "@/lib/db/useLive";
import { PLAYBACK_MODE_KEY, setPlaybackModeCache, type PlaybackMode } from "@/lib/spotify/playback";
import { startWebPlayer, stopWebPlayer } from "@/lib/spotify/web-player";

export function WebPlayerBoot() {
  const { data: session } = useSession();
  const row = useLive(() => getDb().settings.get(PLAYBACK_MODE_KEY), []);
  const mode: PlaybackMode = row?.value === "webApi" ? "webApi" : "webPlayer";
  const loggedIn = !!session?.accessToken;

  useEffect(() => { setPlaybackModeCache(mode); }, [mode]);

  useEffect(() => {
    if (!loggedIn || mode !== "webPlayer") { stopWebPlayer(); return; }
    // getSession() hits /api/auth/session, which refreshes an expiring token.
    startWebPlayer(async () => (await getSession())?.accessToken ?? null);
  }, [loggedIn, mode]);

  return null;
}
