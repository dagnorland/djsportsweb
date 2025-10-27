/**
 * Utility functions for managing track start times with localStorage persistence
 */

import { setLastModified } from '@/lib/supabase/syncService';

const STORAGE_KEY = 'trackStartTimes';

/**
 * Save start time for a specific track
 * @param trackId - The Spotify track ID
 * @param startTimeMs - Start time in milliseconds
 */
export const saveTrackStartTime = (trackId: string, startTimeMs: number): void => {
  if (typeof window === 'undefined') return; // SSR safety

  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    existing[trackId] = startTimeMs;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    setLastModified(); // Update sync timestamp
  } catch (error) {
    console.error('Failed to save track start time:', error);
  }
};

/**
 * Get start time for a specific track
 * @param trackId - The Spotify track ID
 * @returns Start time in milliseconds, or 0 if not found
 */
export const getTrackStartTime = (trackId: string): number => {
  if (typeof window === 'undefined') return 0; // SSR safety
  
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return existing[trackId] || 0;
  } catch (error) {
    console.error('Failed to get track start time:', error);
    return 0;
  }
};

/**
 * Remove start time for a specific track
 * @param trackId - The Spotify track ID
 */
export const removeTrackStartTime = (trackId: string): void => {
  if (typeof window === 'undefined') return; // SSR safety

  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    delete existing[trackId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    setLastModified(); // Update sync timestamp
  } catch (error) {
    console.error('Failed to remove track start time:', error);
  }
};

/**
 * Get all stored start times
 * @returns Object with track IDs as keys and start times as values
 */
export const getAllTrackStartTimes = (): Record<string, number> => {
  if (typeof window === 'undefined') return {}; // SSR safety
  
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch (error) {
    console.error('Failed to get all track start times:', error);
    return {};
  }
};

/**
 * Clear all stored start times
 */
export const clearAllTrackStartTimes = (): void => {
  if (typeof window === 'undefined') return; // SSR safety
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear track start times:', error);
  }
};

/**
 * Load start times from localStorage and merge with PlaylistTrack array
 * @param tracks - Array of PlaylistTrack objects
 * @returns Array of PlaylistTrack objects with start_time_ms populated from localStorage
 */
export const loadTrackStartTimes = (tracks: any[]): any[] => {
  if (typeof window === 'undefined') return tracks; // SSR safety
  
  const startTimes = getAllTrackStartTimes();
  
  return tracks.map(track => {
    if (track.track?.id && startTimes[track.track.id]) {
      return {
        ...track,
        start_time_ms: startTimes[track.track.id]
      };
    }
    return track;
  });
};
