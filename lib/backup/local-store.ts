/** Reads/writes all local data in one go (backup, restore, sync). */
import { getDb } from '@/lib/db/djsports-db';
import type { LocalData, SyncPlan } from './backup-core';

export async function readLocalData(): Promise<LocalData> {
  const db = getDb();
  const [playlists, tracks, trackTimes] = await Promise.all([
    db.djplaylist.toArray(),
    db.djtrack.toArray(),
    db.trackTime.toArray(),
  ]);
  return { playlists, tracks, trackTimes };
}

/** Full restore: clears all local data and writes the backup as-is. */
export async function replaceLocalData(data: LocalData): Promise<void> {
  const db = getDb();
  await db.transaction('rw', db.djplaylist, db.djtrack, db.trackTime, async () => {
    await Promise.all([db.djplaylist.clear(), db.djtrack.clear(), db.trackTime.clear()]);
    await db.djplaylist.bulkPut(data.playlists);
    await db.djtrack.bulkPut(data.tracks);
    await db.trackTime.bulkPut(data.trackTimes);
  });
}

export async function applySyncPlan(plan: SyncPlan): Promise<void> {
  const db = getDb();
  await db.transaction('rw', db.djplaylist, db.djtrack, db.trackTime, async () => {
    await db.djplaylist.bulkPut(plan.playlists);
    await db.djtrack.bulkPut(plan.tracks);
    await db.trackTime.bulkPut(plan.trackTimes);
  });
}
