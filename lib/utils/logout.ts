/**
 * Utility functions for cleaning up localStorage on logout
 */

/**
 * Clear all app-specific localStorage data and Dexie (IndexedDB) stores.
 * This should be called before signOut to ensure clean logout.
 */
export function clearLocalStorage(): void {
  if (typeof window === 'undefined') return; // SSR safety

  try {
    // App-specific data
    localStorage.removeItem('trackStartTimes');
    localStorage.removeItem('playlistTypes');
    localStorage.removeItem('spotify_device_cache');
    localStorage.removeItem('djsports_device_name');
    localStorage.removeItem('djsports_last_modified');
    localStorage.removeItem('djsports_polling_interval');
    localStorage.removeItem('floatingPauseButtonPosition');

    // Theme preference - optional, you might want to keep this
    // Uncomment the line below if you want to clear theme on logout
    // localStorage.removeItem('theme');
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
  }

  // Clear Dexie stores (async, fire and forget)
  Promise.all([
    import('@/lib/db/playlist-store').then(m => m.clearAllPlaylists()),
    import('@/lib/db/track-store').then(m => m.clearAllTracks()),
    import('@/lib/db/tracktime-store').then(m => m.clearAllTrackTimes()),
  ]).catch(err => console.error('Failed to clear Dexie on logout:', err));
}

/**
 * Clear all localStorage data (including theme)
 * Use this for a complete cleanup
 */
export function clearAllLocalStorage(): void {
  if (typeof window === 'undefined') return; // SSR safety

  try {
    clearLocalStorage();
    localStorage.removeItem('theme');
  } catch (error) {
    console.error('Failed to clear all localStorage:', error);
  }
}

