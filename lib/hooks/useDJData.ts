"use client";

import { useMemo } from "react";
import { getDb } from "@/lib/db/djsports-db";
import { useLive } from "@/lib/db/useLive";
import type { DJPlaylist, DJTrack } from "@/lib/types/djmodels";

/** All playlists and tracks, live. `undefined` while loading. */
export function useDJData(): { playlists?: DJPlaylist[]; tracksById?: Map<string, DJTrack> } {
  const playlists = useLive(() => getDb().djplaylist.toArray());
  const tracks = useLive(() => getDb().djtrack.toArray());
  const tracksById = useMemo(() => (tracks ? new Map(tracks.map(t => [t.id, t])) : undefined), [tracks]);
  return { playlists, tracksById };
}
