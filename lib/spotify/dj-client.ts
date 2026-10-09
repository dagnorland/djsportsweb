/**
 * Small browser-side Spotify Web API client for the DJ features (sync,
 * search, play). Calls api.spotify.com directly with the user's token.
 */
import { getCachedDevice } from "@/lib/utils/deviceCache";
import type { Track } from "@/lib/types";

const API = "https://api.spotify.com/v1";

export class SpotifyApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

async function call<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...init?.headers },
  });
  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try { const j = await res.json(); msg = j?.error?.message ?? msg; } catch { /* ignore */ }
    throw new SpotifyApiError(msg, res.status);
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export async function getPlaylistName(token: string, playlistId: string): Promise<string> {
  const p = await call<{ name: string }>(token, `/playlists/${playlistId}?fields=name`);
  return p.name;
}

/** All tracks of a playlist (paged, local/episode items skipped). */
export async function getPlaylistTracks(token: string, playlistId: string): Promise<Track[]> {
  const out: Track[] = [];
  let path: string | null = `/playlists/${playlistId}/tracks?limit=100`;
  while (path) {
    const page: { items: { track: Track | null }[]; next: string | null } = await call(token, path);
    for (const it of page.items) {
      const t = it.track;
      if (t && t.type === "track" && t.id && !t.is_local) out.push(t);
    }
    path = page.next ? page.next.replace(API, "") : null;
  }
  return out;
}

export async function searchTracks(token: string, query: string, limit = 30): Promise<Track[]> {
  if (!query.trim()) return [];
  const r = await call<{ tracks: { items: Track[] } }>(
    token, `/search?type=track&limit=${limit}&q=${encodeURIComponent(query)}`,
  );
  return r.tracks.items;
}

function deviceQuery(): string {
  const id = getCachedDevice()?.id;
  return id ? `?device_id=${encodeURIComponent(id)}` : "";
}

/** Plays one track from `positionMs` on `deviceId`, or the active (or cached) device. */
export async function playTrack(token: string, uri: string, positionMs = 0, deviceId?: string): Promise<void> {
  const q = deviceId ? `?device_id=${encodeURIComponent(deviceId)}` : deviceQuery();
  await call(token, `/me/player/play${q}`, {
    method: "PUT",
    body: JSON.stringify({ uris: [uri], position_ms: Math.max(0, Math.round(positionMs)) }),
  });
}

export async function pause(token: string): Promise<void> {
  await call(token, `/me/player/pause${deviceQuery()}`, { method: "PUT" });
}

export async function resume(token: string): Promise<void> {
  await call(token, `/me/player/play${deviceQuery()}`, { method: "PUT" });
}

export async function seek(token: string, positionMs: number): Promise<void> {
  const q = deviceQuery();
  await call(token, `/me/player/seek?position_ms=${Math.round(positionMs)}${q ? `&${q.slice(1)}` : ""}`, { method: "PUT" });
}

export async function getPlaybackPosition(token: string): Promise<{ uri: string; progressMs: number; isPlaying: boolean } | null> {
  const s = await call<{ item?: { uri: string }; progress_ms?: number; is_playing?: boolean } | undefined>(token, "/me/player");
  if (!s?.item) return null;
  return { uri: s.item.uri, progressMs: s.progress_ms ?? 0, isPlaying: !!s.is_playing };
}

/** Readable message for a failed play (no device, not premium, …). */
export function playErrorMessage(e: unknown): string {
  if (e instanceof SpotifyApiError) {
    if (e.status === 404) return "No active Spotify device — open Spotify on a device and start playing once.";
    if (e.status === 403) return "Spotify refused playback (Premium required, or the device is restricted).";
    if (e.status === 401) return "Spotify session expired — log in again.";
    return e.message;
  }
  return e instanceof Error ? e.message : String(e);
}

/** Current volume 0–100 of the active device, or null. */
export async function getVolume(token: string): Promise<number | null> {
  const s = await call<{ device?: { volume_percent?: number | null } } | undefined>(token, "/me/player");
  return s?.device?.volume_percent ?? null;
}

export async function setVolume(token: string, percent: number): Promise<void> {
  const v = Math.max(0, Math.min(100, Math.round(percent)));
  const q = deviceQuery();
  await call(token, `/me/player/volume?volume_percent=${v}${q ? `&${q.slice(1)}` : ""}`, { method: "PUT" });
}

/** Moves Spotify playback to `deviceId` (PUT /me/player), keeping play/pause. */
export async function transferPlayback(token: string, deviceId: string, play = false): Promise<void> {
  await call(token, "/me/player", { method: "PUT", body: JSON.stringify({ device_ids: [deviceId], play }) });
}
