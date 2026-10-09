/**
 * Playlist editing actions — ports of the logic in Flutter's
 * djplaylist_edit_create.dart and DJPlaylistHive controller.
 */
import { getDb } from "./djsports-db";
import { spotifyIdFromUri } from "./codec";
import { addDJPlaylist, newId } from "./playlist-repo";
import type { DJPlaylist, DJTrack } from "@/lib/types/djmodels";
import type { Track } from "@/lib/types";
import { getPlaylistName, getPlaylistTracks } from "@/lib/spotify/dj-client";

/** Dart `spotifyUriValidate`: open.spotify.com links → bare id/path. */
export function normalizeSpotifyUri(value: string): string {
  const v = value.trim();
  if (!v) return "";
  const pl = v.match(/open\.spotify\.com\/(?:intl-[a-z-]+\/)?playlist\/([A-Za-z0-9]+)/);
  if (pl) return pl[1];
  const al = v.match(/open\.spotify\.com\/(?:intl-[a-z-]+\/)?(album\/[A-Za-z0-9]+)/);
  if (al) return al[1];
  return v;
}

/** Dart `DJTrack.fromSpotifyTrack`. */
export function djTrackFromSpotify(t: Track): DJTrack {
  return {
    id: t.id,
    name: t.name,
    album: t.album?.name ?? "",
    artist: t.artists?.[0]?.name ?? "",
    startTime: 0,
    startTimeMS: 0,
    duration: t.duration_ms ?? 0,
    playCount: 0,
    spotifyUri: t.uri,
    mp3Uri: "",
    networkImageUri: t.album?.images?.[0]?.url ?? "",
    shortcut: "",
    appleMusicId: "",
  };
}

export interface PlaylistForm {
  name: string;
  type: string;
  spotifyUri: string;
  appleMusicPlaylistId: string;
  shuffleAtEnd: boolean;
  autoNext: boolean;
  position: number;
}

export async function createPlaylist(form: PlaylistForm): Promise<DJPlaylist> {
  return addDJPlaylist({
    id: newId(),
    name: form.name,
    type: form.type,
    spotifyUri: normalizeSpotifyUri(form.spotifyUri),
    appleMusicPlaylistId: form.appleMusicPlaylistId.trim(),
    shuffleAtEnd: form.shuffleAtEnd,
    autoNext: form.autoNext,
    position: form.position,
    currentTrack: 0,
    playCount: 0,
    trackIds: [],
  });
}

export async function updatePlaylistFromForm(id: string, form: PlaylistForm): Promise<void> {
  await getDb().djplaylist.update(id, {
    name: form.name,
    type: form.type,
    spotifyUri: normalizeSpotifyUri(form.spotifyUri),
    appleMusicPlaylistId: form.appleMusicPlaylistId.trim(),
    shuffleAtEnd: form.shuffleAtEnd,
    autoNext: form.autoNext,
    position: form.position,
  });
}

/**
 * Adds tracks to a playlist. Existing DJTracks keep their start time and
 * play count; a start time from the TrackTime library is used for new ones.
 * Tracks whose Spotify URI is already in the playlist are skipped.
 */
export async function addTracksToPlaylist(playlistId: string, tracks: DJTrack[]): Promise<{ added: number; skipped: number }> {
  const db = getDb();
  return db.transaction("rw", db.djplaylist, db.djtrack, db.trackTime, async () => {
    const p = await db.djplaylist.get(playlistId);
    if (!p) throw new Error("Playlist not found");
    const existing = (await db.djtrack.bulkGet(p.trackIds)).filter((t): t is DJTrack => !!t);
    const uris = new Set(existing.map(t => t.spotifyUri).filter(Boolean));
    const ids = new Set(p.trackIds);
    let added = 0, skipped = 0;
    for (const t of tracks) {
      if ((t.spotifyUri && uris.has(t.spotifyUri)) || ids.has(t.id)) { skipped++; continue; }
      const known = await db.djtrack.get(t.id);
      if (!known) {
        const tt = await db.trackTime.get(t.id);
        await db.djtrack.put(tt ? { ...t, startTime: tt.startTime, startTimeMS: tt.startTimeMS ?? 0 } : t);
      }
      p.trackIds.push(t.id);
      ids.add(t.id);
      if (t.spotifyUri) uris.add(t.spotifyUri);
      added++;
    }
    await db.djplaylist.put(p);
    return { added, skipped };
  });
}

/** Dart `_spotifyPlaylistSync`: import missing tracks + take Spotify's name. */
export async function syncPlaylistFromSpotify(token: string, playlistId: string): Promise<{ added: number; skipped: number; total: number; name: string }> {
  const p = await getDb().djplaylist.get(playlistId);
  if (!p) throw new Error("Playlist not found");
  const sid = spotifyIdFromUri(p.spotifyUri);
  if (!sid) throw new Error("No Spotify playlist set");
  const [name, tracks] = await Promise.all([getPlaylistName(token, sid), getPlaylistTracks(token, sid)]);
  const r = await addTracksToPlaylist(playlistId, tracks.map(djTrackFromSpotify));
  if (r.added > 0 && name) await getDb().djplaylist.update(playlistId, { name });
  const after = await getDb().djplaylist.get(playlistId);
  return { ...r, total: after?.trackIds.length ?? 0, name };
}

/** Tracks in the Spotify playlist that are not in the DJ playlist yet. */
export async function findNewSpotifyTracks(token: string, playlistId: string): Promise<Track[]> {
  const db = getDb();
  const p = await db.djplaylist.get(playlistId);
  const sid = p && spotifyIdFromUri(p.spotifyUri);
  if (!p || !sid) return [];
  const existing = (await db.djtrack.bulkGet(p.trackIds)).filter((t): t is DJTrack => !!t);
  const uris = new Set(existing.map(t => t.spotifyUri));
  return (await getPlaylistTracks(token, sid)).filter(t => t.uri && !uris.has(t.uri));
}

/** Dart `removeDJTrackFromPlaylist`: also deletes the track if no other playlist uses it. */
export async function removeTrackFromPlaylist(playlistId: string, index: number): Promise<void> {
  const db = getDb();
  await db.transaction("rw", db.djplaylist, db.djtrack, async () => {
    const all = await db.djplaylist.toArray();
    const p = all.find(x => x.id === playlistId);
    if (!p) return;
    const [trackId] = p.trackIds.splice(index, 1);
    if (p.currentTrack >= p.trackIds.length) p.currentTrack = 0;
    await db.djplaylist.put(p);
    const used = all.some(x => x.id !== playlistId && x.trackIds.includes(trackId)) || p.trackIds.includes(trackId);
    if (!used) await db.djtrack.delete(trackId);
  });
}

export async function moveTrackInPlaylist(playlistId: string, from: number, to: number): Promise<void> {
  const db = getDb();
  const p = await db.djplaylist.get(playlistId);
  if (!p || from === to) return;
  const [id] = p.trackIds.splice(from, 1);
  p.trackIds.splice(to, 0, id);
  await db.djplaylist.put(p);
}

export async function shufflePlaylist(playlistId: string): Promise<void> {
  const db = getDb();
  const p = await db.djplaylist.get(playlistId);
  if (!p) return;
  const ids = [...p.trackIds];
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  await db.djplaylist.update(playlistId, { trackIds: ids, currentTrack: 0 });
}

/** Dart `syncMissingStartTimes`: fill start time 0 from the TrackTime library. */
export async function syncMissingStartTimes(playlistId: string): Promise<number> {
  const db = getDb();
  return db.transaction("rw", db.djplaylist, db.djtrack, db.trackTime, async () => {
    const p = await db.djplaylist.get(playlistId);
    if (!p) return 0;
    let updated = 0;
    for (const t of (await db.djtrack.bulkGet(p.trackIds)).filter((x): x is DJTrack => !!x)) {
      if (t.startTime !== 0) continue;
      const tt = await db.trackTime.get(t.id);
      if (tt && tt.startTime > 0) {
        await db.djtrack.update(t.id, { startTime: tt.startTime });
        updated++;
      }
    }
    return updated;
  });
}

/** "djSports Example Setup" (first_time_use_screen.dart `_sampleDefs`). */
export const EXAMPLE_SETUP: { type: string; uri: string }[] = [
  { type: "hotspot", uri: "5IdSziWdXmWfhILWI41KNF" },
  { type: "match", uri: "2T2tlhNo79SxGeoPoOGiOI" },
  { type: "match", uri: "2PCecVUcJmyGHBRBzpp1c4" },
  { type: "funStuff", uri: "3skHFi4Rs2gkQo9UXUUo7O" },
  { type: "preMatch", uri: "1ALsjB5ib94JNTXrnkie1N" },
];

/**
 * Fetches every example playlist from Spotify first, then writes them in
 * one transaction (so the welcome screen isn't swapped out mid-way).
 */
export async function loadExampleSetup(
  token: string,
  onProgress: (i: number, state: { status: "syncing" | "done" | "error"; name?: string; trackCount?: number; error?: string }) => void,
): Promise<void> {
  const fetched: { def: (typeof EXAMPLE_SETUP)[number]; name: string; tracks: DJTrack[] }[] = [];
  for (let i = 0; i < EXAMPLE_SETUP.length; i++) {
    const def = EXAMPLE_SETUP[i];
    onProgress(i, { status: "syncing" });
    try {
      const [name, tracks] = await Promise.all([getPlaylistName(token, def.uri), getPlaylistTracks(token, def.uri)]);
      fetched.push({ def, name, tracks: tracks.map(djTrackFromSpotify) });
      onProgress(i, { status: "done", name, trackCount: tracks.length });
    } catch (e) {
      onProgress(i, { status: "error", error: e instanceof Error ? e.message : String(e) });
    }
  }
  const db = getDb();
  await db.transaction("rw", db.djplaylist, db.djtrack, db.trackTime, async () => {
    for (let i = 0; i < fetched.length; i++) {
      const { def, name, tracks } = fetched[i];
      if ((await db.djplaylist.toArray()).some(p => spotifyIdFromUri(p.spotifyUri) === def.uri)) continue;
      for (const t of tracks) {
        if (await db.djtrack.get(t.id)) continue;
        const tt = await db.trackTime.get(t.id);
        await db.djtrack.put(tt ? { ...t, startTime: tt.startTime, startTimeMS: tt.startTimeMS ?? 0 } : t);
      }
      await db.djplaylist.add({
        id: newId(), name: name || def.type, type: def.type, spotifyUri: def.uri,
        autoNext: true, shuffleAtEnd: false, currentTrack: 0, playCount: 0,
        trackIds: [...new Set(tracks.map(t => t.id))], position: i, appleMusicPlaylistId: "",
      });
    }
  });
}
