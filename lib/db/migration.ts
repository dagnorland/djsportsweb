/**
 * One-time migration from localStorage → Dexie.
 * Called after Spotify data has been fetched and written to Dexie.
 */

import { getDb } from './djsports-db';

const MIGRATION_FLAG = 'migrationComplete';

export async function isMigrationComplete(): Promise<boolean> {
  if (typeof window === 'undefined') return true;
  const db = getDb();
  const meta = await db.meta.get(MIGRATION_FLAG);
  return meta?.value === 'true';
}

/**
 * Call this after Spotify data is fetched and upserted to Dexie.
 * Clears legacy holding tables and old localStorage keys.
 */
export async function runMigrationIfNeeded(): Promise<void> {
  if (typeof window === 'undefined') return;

  const done = await isMigrationComplete();
  if (done) return;

  const db = getDb();

  // Check if we have real Dexie data (migration can only complete after Spotify fetch)
  const trackCount = await db.tracks.count();
  const playlistCount = await db.playlists.count();
  if (trackCount === 0 && playlistCount === 0) {
    // Data not yet populated; wait for next trigger
    return;
  }

  // Enrich tracks with legacy start times (in case upsertTrackFromSpotify didn't see them)
  const legacyTimes = await db.legacyStartTimes.toArray();
  for (const lt of legacyTimes) {
    const track = await db.tracks.get(lt.id);
    if (track && track.startTimeMS === 0) {
      track.startTimeMS = lt.startTimeMS;
      track.startTime = Math.floor(lt.startTimeMS / 1000);
      await db.tracks.put(track);
    }
  }

  // Enrich playlists with legacy types
  const legacyTypes = await db.legacyPlaylistTypes.toArray();
  for (const lt of legacyTypes) {
    const playlist = await db.playlists.get(lt.id);
    if (playlist && playlist.type === 'none') {
      playlist.type = lt.type;
      await db.playlists.put(playlist);
    }
  }

  // Clear holding tables
  await db.legacyStartTimes.clear();
  await db.legacyPlaylistTypes.clear();

  // Remove old localStorage keys
  try {
    window.localStorage.removeItem('trackStartTimes');
    window.localStorage.removeItem('playlistTypes');
  } catch (_) { /* ignore */ }

  // Mark migration complete
  await db.meta.put({ key: MIGRATION_FLAG, value: 'true' });
  console.log('[migration] localStorage → Dexie migration complete');
}
