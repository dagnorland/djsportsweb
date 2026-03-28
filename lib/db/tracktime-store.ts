import { getDb } from './djsports-db';
import type { TrackTime } from '@/lib/types/djmodels';

export async function upsertTrackTime(id: string, startTimeMS: number): Promise<void> {
  const db = getDb();
  const startTime = Math.floor(startTimeMS / 1000);
  const record: TrackTime = { id, startTime };
  if (startTimeMS > 0) {
    record.startTimeMS = startTimeMS;
  }
  await db.trackTimes.put(record);
}

export async function getTrackTime(id: string): Promise<TrackTime | undefined> {
  return getDb().trackTimes.get(id);
}

export async function getAllTrackTimes(): Promise<TrackTime[]> {
  return getDb().trackTimes.toArray();
}

export async function deleteTrackTime(id: string): Promise<void> {
  return getDb().trackTimes.delete(id);
}

export async function clearAllTrackTimes(): Promise<void> {
  return getDb().trackTimes.clear();
}
