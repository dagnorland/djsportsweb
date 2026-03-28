/**
 * Utility functions for managing DJ playlist types.
 * Backed by Dexie (IndexedDB) with localStorage as SSR/migration fallback.
 */

import { DJPlaylistType } from "@/lib/types";

/**
 * Save DJ playlist type for a specific playlist
 */
export const savePlaylistType = (playlistId: string, playlistType: DJPlaylistType): void => {
  if (typeof window === 'undefined') return;

  import('@/lib/db/playlist-store').then(({ setPlaylistType }) => {
    setPlaylistType(playlistId, playlistType).catch(err =>
      console.error('Failed to save playlist type:', err)
    );
  });
};

/**
 * Get DJ playlist type for a specific playlist (async)
 */
export const getPlaylistType = async (playlistId: string): Promise<DJPlaylistType | null> => {
  if (typeof window === 'undefined') return null;
  const { getPlaylistType: dbGet } = await import('@/lib/db/playlist-store');
  const type = await dbGet(playlistId);
  return (type as DJPlaylistType) ?? null;
};

/**
 * Remove DJ playlist type for a specific playlist
 */
export const removePlaylistType = (playlistId: string): void => {
  if (typeof window === 'undefined') return;

  import('@/lib/db/playlist-store').then(({ setPlaylistType }) => {
    setPlaylistType(playlistId, 'none').catch(err =>
      console.error('Failed to remove playlist type:', err)
    );
  });
};

/**
 * Get all stored playlist types (async)
 */
export const getAllPlaylistTypes = async (): Promise<Record<string, DJPlaylistType>> => {
  if (typeof window === 'undefined') return {};
  const { getAllPlaylists } = await import('@/lib/db/playlist-store');
  const playlists = await getAllPlaylists();
  const result: Record<string, DJPlaylistType> = {};
  for (const p of playlists) {
    if (p.type && p.type !== 'none') {
      result[p.id] = p.type as DJPlaylistType;
    }
  }
  return result;
};

/**
 * Clear all stored playlist types
 */
export const clearAllPlaylistTypes = async (): Promise<void> => {
  if (typeof window === 'undefined') return;
  const { clearAllPlaylists } = await import('@/lib/db/playlist-store');
  await clearAllPlaylists();
};

/**
 * Get available DJ playlist type options
 */
export const getPlaylistTypeOptions = (): { value: DJPlaylistType; label: string }[] => {
  return [
    { value: "none", label: "Ingen" },
    { value: "hotspot", label: "Hotspot" },
    { value: "match", label: "Match" },
    { value: "funStuff", label: "Fun Stuff" },
    { value: "preMatch", label: "Pre Match" }
  ];
};
