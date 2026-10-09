/**
 * Start-time list and playlist sharing — ports of Flutter's
 * track_time/tabs/start_time_tab.dart and playlists_tab.dart.
 * JSON formats are identical, so lists move between app and web.
 */
import { getDb } from "./djsports-db";
import { trackTimeFromJson, trackTimeToJson, trackTimeFromTrack } from "./codec";
import { newId } from "./playlist-repo";
import { isDJPlaylistType, type TrackTime } from "@/lib/types/djmodels";

export const EXAMPLE_TRACK_TIME_JSON =
  '[\n  {"id":"6epn3r7S14KUqlReYr77hA","startTime":11000},\n  {"id":"4vVTI94F9uJ8lHNDWKv0i2","startTime":36000}\n]';

/** JSON of the start-time list (Copy to clipboard). */
export async function exportTrackTimesJson(): Promise<{ json: string; count: number }> {
  const list = await getDb().trackTime.toArray();
  return { json: JSON.stringify(list.map(trackTimeToJson)), count: list.length };
}

/** "Update the list with missing start times from tracks in your playlists." */
export async function addMissingFromTracks(): Promise<{ added: number; total: number }> {
  const db = getDb();
  const tracks = (await db.djtrack.toArray()).filter(t => t.spotifyUri && t.startTime > 0); // getStartTimes()
  const known = new Set((await db.trackTime.toArray()).map(t => t.id));
  const add = tracks.filter(t => !known.has(t.id)).map(trackTimeFromTrack);
  await db.trackTime.bulkPut(add);
  return { added: add.length, total: tracks.length };
}

function parseList(text: string): Record<string, unknown>[] {
  let decoded: unknown;
  try { decoded = JSON.parse(text); } catch { throw new Error("Invalid JSON — check the format and try again."); }
  if (!Array.isArray(decoded)) throw new Error("JSON must be a list.");
  for (const x of decoded) if (!x || typeof x !== "object" || Array.isArray(x)) throw new Error("Each item must be an object.");
  return decoded as Record<string, unknown>[];
}

/** Adds pasted start times that aren't in the list yet. */
export async function importTrackTimesJson(text: string): Promise<number> {
  const items = parseList(text).map(trackTimeFromJson).filter(t => t.id);
  const db = getDb();
  const known = new Set((await db.trackTime.toArray()).map(t => t.id));
  const add: TrackTime[] = [];
  for (const t of items) if (!known.has(t.id)) { add.push(t); known.add(t.id); }
  await db.trackTime.bulkPut(add);
  return add.length;
}

/** "Update all tracks with no start time from list." */
export async function applyListToTracksWithoutStartTime(): Promise<number> {
  const db = getDb();
  return db.transaction("rw", db.djtrack, db.trackTime, async () => {
    const byId = new Map((await db.trackTime.toArray()).map(t => [t.id, t]));
    let n = 0;
    for (const t of await db.djtrack.toArray()) {
      if (t.startTime !== 0) continue;
      const m = byId.get(t.id);
      if (m && m.startTime > 0) {
        await db.djtrack.update(t.id, { startTime: m.startTime, startTimeMS: m.startTimeMS ?? 0 });
        n++;
      }
    }
    return n;
  });
}

export async function countTrackTimes(): Promise<{ total: number; zero: number }> {
  const list = await getDb().trackTime.toArray();
  return { total: list.length, zero: list.filter(t => t.startTime === 0).length };
}

/** Delete the whole list, or only entries with no start time. */
export async function deleteTrackTimes(onlyZero: boolean): Promise<number> {
  const db = getDb();
  const list = await db.trackTime.toArray();
  const ids = list.filter(t => !onlyZero || t.startTime === 0).map(t => t.id);
  await db.trackTime.bulkDelete(ids);
  return ids.length;
}

/** Playlists as JSON (URI + type + name) — `_copyPlaylistUrisToClipboard`. */
export async function exportPlaylistsJson(): Promise<{ json: string; count: number }> {
  const list = (await getDb().djplaylist.toArray()).sort((a, b) => a.type.localeCompare(b.type) || a.position - b.position);
  const data = list.map(p => ({ playlistUri: p.spotifyUri, playlistType: p.type, name: p.name }));
  return { json: JSON.stringify(data, null, 2), count: list.length };
}

/** `_importPlaylistsFromJson`: new playlists (no tracks yet — open each to Sync). */
export async function importPlaylistsJson(text: string): Promise<{ added: number; skipped: number }> {
  const items = parseList(text);
  const db = getDb();
  const uris = new Set((await db.djplaylist.toArray()).map(p => p.spotifyUri).filter(Boolean));
  let added = 0, skipped = 0;
  for (const it of items) {
    const uri = typeof it.playlistUri === "string" ? it.playlistUri : "";
    if (!uri) continue;
    if (uris.has(uri)) { skipped++; continue; }
    const type = isDJPlaylistType(it.playlistType) ? it.playlistType : "hotspot";
    await db.djplaylist.add({
      id: newId(), name: typeof it.name === "string" ? it.name : "Imported playlist", type, spotifyUri: uri,
      autoNext: true, shuffleAtEnd: false, currentTrack: 0, playCount: 0, trackIds: [], position: 0,
      appleMusicPlaylistId: "",
    });
    uris.add(uri);
    added++;
  }
  return { added, skipped };
}
