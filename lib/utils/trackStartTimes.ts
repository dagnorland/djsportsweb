/**
 * Track start time helpers for the old pages. Values are the playback
 * position in ms (= DJTrack.startTime + startTimeMS, Flutter semantics).
 */
import { startPositionMs } from '@/lib/types/djmodels';

export const saveTrackStartTime = (trackId: string, startTimeMs: number): void => {
  if (typeof window === 'undefined') return;
  import('@/lib/db/track-repo').then(({ setTrackStartTime }) =>
    setTrackStartTime(trackId, startTimeMs, 0)
  ).catch(err => console.error('Failed to save track start time:', err));
};

/** Synchronous reads are no longer supported; always 0. Use the async version. */
export const getTrackStartTime = (_trackId: string): number => 0;

export const getTrackStartTimeAsync = async (trackId: string): Promise<number> => {
  if (typeof window === 'undefined') return 0;
  const { getDJTrack } = await import('@/lib/db/track-repo');
  const t = await getDJTrack(trackId);
  return t ? startPositionMs(t) : 0;
};

export const removeTrackStartTime = (trackId: string): void => saveTrackStartTime(trackId, 0);

export const getAllTrackStartTimes = async (): Promise<Record<string, number>> => {
  if (typeof window === 'undefined') return {};
  const { getDJTracks } = await import('@/lib/db/track-repo');
  const result: Record<string, number> = {};
  for (const t of await getDJTracks()) {
    const ms = startPositionMs(t);
    if (ms > 0) result[t.id] = ms;
  }
  return result;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const loadTrackStartTimes = async (tracks: any[]): Promise<any[]> => {
  if (typeof window === 'undefined') return tracks;
  const startTimes = await getAllTrackStartTimes();
  if (Object.keys(startTimes).length === 0) return tracks;
  return tracks.map(track =>
    track.track?.id && startTimes[track.track.id]
      ? { ...track, start_time_ms: startTimes[track.track.id] }
      : track
  );
};
