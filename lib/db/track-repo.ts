/** Port of Flutter `DJTrackRepo` + `TrackTimeRepo`. */
import { getDb } from './djsports-db';
import type { DJTrack, TrackTime } from '@/lib/types/djmodels';
import { trackTimeFromTrack } from './codec';
import type { Track } from '@/lib/types';

export async function getDJTracks(): Promise<DJTrack[]> {
  return getDb().djtrack.toArray();
}

export async function getDJTrack(id: string): Promise<DJTrack | undefined> {
  return getDb().djtrack.get(id);
}

export async function getDJTracksByIds(ids: string[]): Promise<DJTrack[]> {
  const rows = await getDb().djtrack.bulkGet(ids);
  return rows.filter((t): t is DJTrack => !!t);
}

export async function addDJTrack(t: DJTrack): Promise<void> {
  await getDb().djtrack.put(t);
}

export async function updateDJTrack(t: DJTrack): Promise<void> {
  await getDb().djtrack.put(t);
}

export async function removeDJTrack(id: string): Promise<void> {
  await getDb().djtrack.delete(id);
}

/** Sets a track's start time (ms) and keeps its TrackTime in sync. */
export async function setTrackStartTime(id: string, startTime: number, startTimeMS = 0): Promise<void> {
  const db = getDb();
  await db.transaction('rw', db.djtrack, db.trackTime, async () => {
    const t = await db.djtrack.get(id);
    if (!t) return;
    t.startTime = startTime;
    t.startTimeMS = startTimeMS;
    await db.djtrack.put(t);
    await db.trackTime.put(trackTimeFromTrack(t));
  });
}

/** Dart `DJTrack.fromSpotifyTrack` (keeps start time/playCount if known). */
export async function upsertTrackFromSpotify(s: Track): Promise<DJTrack | undefined> {
  if (!s.id) return undefined;
  const db = getDb();
  const existing = await db.djtrack.get(s.id);
  const known = existing ? undefined : await db.trackTime.get(s.id);
  const t: DJTrack = {
    id: s.id,
    name: s.name,
    album: s.album?.name ?? '',
    artist: s.artists?.[0]?.name ?? '',
    startTime: existing?.startTime ?? known?.startTime ?? 0,
    startTimeMS: existing?.startTimeMS ?? known?.startTimeMS ?? 0,
    duration: s.duration_ms ?? 0,
    playCount: existing?.playCount ?? 0,
    spotifyUri: s.uri,
    mp3Uri: existing?.mp3Uri ?? '',
    networkImageUri: s.album?.images?.[0]?.url ?? existing?.networkImageUri ?? '',
    shortcut: existing?.shortcut ?? '',
    appleMusicId: existing?.appleMusicId ?? '',
  };
  await db.djtrack.put(t);
  return t;
}

export async function deleteAllTracks(): Promise<void> {
  await getDb().djtrack.clear();
}

// --- TrackTime (separate box in Flutter; a library of known start times) ---

export async function getTrackTimes(): Promise<TrackTime[]> {
  return getDb().trackTime.toArray();
}

export async function getTrackTime(id: string): Promise<TrackTime | undefined> {
  return getDb().trackTime.get(id);
}

export async function putTrackTime(tt: TrackTime): Promise<void> {
  await getDb().trackTime.put(tt);
}

export async function removeTrackTime(id: string): Promise<void> {
  await getDb().trackTime.delete(id);
}

export async function deleteAllTrackTimes(): Promise<void> {
  await getDb().trackTime.clear();
}
