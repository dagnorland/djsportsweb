/**
 * Utility functions for managing track start times.
 * Backed by Dexie (IndexedDB) with localStorage as SSR/migration fallback.
 */

/**
 * Save start time for a specific track
 */
export const saveTrackStartTime = (trackId: string, startTimeMs: number): void => {
  if (typeof window === 'undefined') return;

  import('@/lib/db/track-store').then(({ setTrackStartTime }) => {
    setTrackStartTime(trackId, startTimeMs).catch(err =>
      console.error('Failed to save track start time:', err)
    );
  });
};

/**
 * Get start time for a specific track (synchronous, reads localStorage migration fallback)
 * For accurate reads use getTrackStartTimeAsync.
 */
export const getTrackStartTime = (trackId: string): number => {
  if (typeof window === 'undefined') return 0;
  try {
    const stored = window.localStorage.getItem('trackStartTimes');
    if (stored) {
      const map: Record<string, number> = JSON.parse(stored);
      return map[trackId] ?? 0;
    }
  } catch (_) { /* ignore */ }
  return 0;
};

/**
 * Get start time for a specific track (async, reads from Dexie)
 */
export const getTrackStartTimeAsync = async (trackId: string): Promise<number> => {
  if (typeof window === 'undefined') return 0;
  const { getTrackStartTime: dbGet } = await import('@/lib/db/track-store');
  return dbGet(trackId);
};

/**
 * Remove start time for a specific track
 */
export const removeTrackStartTime = (trackId: string): void => {
  if (typeof window === 'undefined') return;

  import('@/lib/db/track-store').then(({ removeTrackStartTime: dbRemove }) => {
    dbRemove(trackId).catch(err =>
      console.error('Failed to remove track start time:', err)
    );
  });
};

/**
 * Get all stored start times (async)
 */
export const getAllTrackStartTimes = async (): Promise<Record<string, number>> => {
  if (typeof window === 'undefined') return {};
  const { getAllTracks } = await import('@/lib/db/track-store');
  const tracks = await getAllTracks();
  const result: Record<string, number> = {};
  for (const t of tracks) {
    if (t.startTimeMS > 0) result[t.id] = t.startTimeMS;
  }
  return result;
};

/**
 * Clear all stored start times
 */
export const clearAllTrackStartTimes = async (): Promise<void> => {
  if (typeof window === 'undefined') return;
  const [{ clearAllTracks }, { clearAllTrackTimes }] = await Promise.all([
    import('@/lib/db/track-store'),
    import('@/lib/db/tracktime-store'),
  ]);
  await Promise.all([clearAllTracks(), clearAllTrackTimes()]);
};

/**
 * Load start times from Dexie and merge with PlaylistTrack array (async)
 */
export const loadTrackStartTimes = async (tracks: any[]): Promise<any[]> => {
  if (typeof window === 'undefined') return tracks;
  const startTimes = await getAllTrackStartTimes();
  if (Object.keys(startTimes).length === 0) return tracks;
  return tracks.map(track => {
    if (track.track?.id && startTimes[track.track.id]) {
      return { ...track, start_time_ms: startTimes[track.track.id] };
    }
    return track;
  });
};
