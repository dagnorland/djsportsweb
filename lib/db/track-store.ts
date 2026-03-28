import { getDb } from './djsports-db';
import { upsertTrackTime } from './tracktime-store';
import type { DJTrack } from '@/lib/types/djmodels';
import type { Track } from '@/lib/types';

export async function upsertTrackFromSpotify(spotifyTrack: Track, startTimeMS?: number): Promise<void> {
  if (!spotifyTrack.id) return;
  const db = getDb();

  // Check existing record first — needed to preserve startTimeMS, playCount, shortcut, mp3Uri
  const existing = await db.tracks.get(spotifyTrack.id);

  // Resolve start time: explicit arg > existing Dexie value (e.g. restored from backup) > legacy table
  let resolvedStartTimeMS = startTimeMS ?? 0;
  if (resolvedStartTimeMS === 0) {
    if (existing?.startTimeMS) {
      resolvedStartTimeMS = existing.startTimeMS;
    } else {
      const legacy = await db.legacyStartTimes.get(spotifyTrack.id);
      if (legacy) {
        resolvedStartTimeMS = legacy.startTimeMS;
      }
    }
  }

  const imageUri = spotifyTrack.album?.images?.[0]?.url ?? '';
  const artistName = spotifyTrack.artists?.map(a => a.name).join(', ') ?? '';

  const record: DJTrack = {
    id: spotifyTrack.id,
    name: spotifyTrack.name,
    album: spotifyTrack.album?.name ?? '',
    artist: artistName,
    startTime: Math.floor(resolvedStartTimeMS / 1000),
    startTimeMS: resolvedStartTimeMS,
    duration: spotifyTrack.duration_ms,
    playCount: existing?.playCount ?? 0,
    spotifyUri: spotifyTrack.uri,
    mp3Uri: '',
    networkImageUri: imageUri,
    shortcut: existing?.shortcut ?? '',
  };

  await db.tracks.put(record);

  if (resolvedStartTimeMS > 0) {
    await upsertTrackTime(spotifyTrack.id, resolvedStartTimeMS);
  }
}

export async function setTrackStartTime(id: string, startTimeMS: number): Promise<void> {
  const db = getDb();
  const existing = await db.tracks.get(id);
  if (existing) {
    existing.startTimeMS = startTimeMS;
    existing.startTime = Math.floor(startTimeMS / 1000);
    await db.tracks.put(existing);
  }
  await upsertTrackTime(id, startTimeMS);
}

export async function getTrackStartTime(id: string): Promise<number> {
  const db = getDb();
  const track = await db.tracks.get(id);
  if (track) return track.startTimeMS;
  // Fall back to legacy table during migration window
  const legacy = await db.legacyStartTimes.get(id);
  return legacy?.startTimeMS ?? 0;
}

export async function removeTrackStartTime(id: string): Promise<void> {
  const db = getDb();
  const existing = await db.tracks.get(id);
  if (existing) {
    existing.startTimeMS = 0;
    existing.startTime = 0;
    await db.tracks.put(existing);
  }
  await db.trackTimes.delete(id);
}

export async function getAllTracks(): Promise<DJTrack[]> {
  return getDb().tracks.toArray();
}

export async function clearAllTracks(): Promise<void> {
  return getDb().tracks.clear();
}
