/**
 * Utility functions for checking track availability
 */

import { Track, Episode, PlaylistTrack } from "@/lib/types";

/**
 * Checks if a track is unavailable for playback
 * @param track - The track or episode object, or null
 * @returns true if the track is unavailable, false otherwise
 */
export function isTrackUnavailable(track: Track | Episode | null | undefined): boolean {
  if (!track) {
    return true; // Track is null/undefined, so it's unavailable
  }

  // Check if it's a Track (has album property)
  if ("album" in track) {
    // For Track objects, check is_playable and restrictions
    if (track.is_playable === false) {
      return true;
    }
    
    // Check if available_markets is an empty array (means not available in any market)
    if (!track.available_markets) {
      return true;
    }
        
    // Check if there are restrictions
    if (track.restrictions && track.restrictions.length > 0) {
      // Check if any restriction prevents playback
      const blockingRestrictions = track.restrictions.filter(
        (restriction) => restriction.reason === "market" || restriction.reason === "product"
      );
      if (blockingRestrictions.length > 0) {
        return true;
      }
  
    }
  } else {
    // For Episode objects, check is_playable
    if (track.is_playable === false) {
      return true;
    }
    
    // Check restrictions for episodes as well
    if (track.restrictions && track.restrictions.length > 0) {
      const blockingRestrictions = track.restrictions.filter(
        (restriction) => restriction.reason === "market" || restriction.reason === "product"
      );
      if (blockingRestrictions.length > 0) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Checks if a PlaylistTrack is unavailable for playback
 * @param playlistTrack - The PlaylistTrack object
 * @returns true if the track is unavailable, false otherwise
 */
export function isPlaylistTrackUnavailable(playlistTrack: PlaylistTrack): boolean {
  return isTrackUnavailable(playlistTrack.track);
}

