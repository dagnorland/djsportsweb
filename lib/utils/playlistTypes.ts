/**
 * Utility functions for managing DJ playlist types with localStorage persistence
 */

import { DJPlaylistType } from "@/lib/types";
import { setLastModified } from '@/lib/supabase/syncService';

const STORAGE_KEY = 'playlistTypes';

/**
 * Save DJ playlist type for a specific playlist
 * @param playlistId - The Spotify playlist ID
 * @param playlistType - The DJ playlist type
 */
export const savePlaylistType = (playlistId: string, playlistType: DJPlaylistType): void => {
  if (typeof window === 'undefined') return; // SSR safety

  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    existing[playlistId] = playlistType;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    setLastModified(); // Update sync timestamp
  } catch (error) {
    console.error('Failed to save playlist type:', error);
  }
};

/**
 * Get DJ playlist type for a specific playlist
 * @param playlistId - The Spotify playlist ID
 * @returns DJ playlist type, or null if not found
 */
export const getPlaylistType = (playlistId: string): DJPlaylistType | null => {
  if (typeof window === 'undefined') return null; // SSR safety
  
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return existing[playlistId] || null;
  } catch (error) {
    console.error('Failed to get playlist type:', error);
    return null;
  }
};

/**
 * Remove DJ playlist type for a specific playlist
 * @param playlistId - The Spotify playlist ID
 */
export const removePlaylistType = (playlistId: string): void => {
  if (typeof window === 'undefined') return; // SSR safety

  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    delete existing[playlistId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    setLastModified(); // Update sync timestamp
  } catch (error) {
    console.error('Failed to remove playlist type:', error);
  }
};

/**
 * Get all stored playlist types
 * @returns Object with playlist IDs as keys and DJ playlist types as values
 */
export const getAllPlaylistTypes = (): Record<string, DJPlaylistType> => {
  if (typeof window === 'undefined') return {}; // SSR safety
  
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch (error) {
    console.error('Failed to get all playlist types:', error);
    return {};
  }
};

/**
 * Clear all stored playlist types
 */
export const clearAllPlaylistTypes = (): void => {
  if (typeof window === 'undefined') return; // SSR safety
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear playlist types:', error);
  }
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