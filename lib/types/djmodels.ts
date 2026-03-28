/**
 * DJ data models matching Flutter's djsports app JSON serialization exactly.
 * These types are used for Dexie (local DB) and Firestore backup/restore.
 */

export interface DJPlaylist {
  id: string;
  name: string;
  type: string; // 'hotspot' | 'match' | 'funStuff' | 'preMatch' | 'archived' | 'none'
  spotifyUri: string;
  autoNext: boolean;
  shuffleAtEnd: boolean;
  currentTrack: number;
  playCount: number;
  trackIds: string[];
  position: number;
}

export interface DJTrack {
  id: string;
  name: string;
  album: string;
  artist: string;
  startTime: number;       // seconds (derived: Math.floor(startTimeMS / 1000))
  startTimeMS: number;     // milliseconds — Flutter also stores startTime in ms, same value
  duration: number;        // milliseconds
  playCount: number;
  spotifyUri: string;
  mp3Uri: string;          // always '' in React
  networkImageUri: string;
  shortcut: string;        // '' or '1'-'9'
}

export interface TrackTime {
  id: string;              // references DJTrack.id
  startTime: number;       // seconds
  startTimeMS?: number;    // omitted when 0/null (matches Flutter conditional toJson)
}

export interface BackupSummary {
  id: string;
  spotifyUserId: string;
  spotifyDisplayName: string;
  deviceName: string;
  createdAt: Date;
  playlistCount: number;
  trackCount: number;
  tracksWithStartTime: number;
  version: string;
}

export interface BackupDocument {
  spotifyUserId: string;
  spotifyDisplayName: string;
  deviceName: string;
  createdAt: unknown; // Firestore Timestamp or serverTimestamp sentinel
  version: string;
  playlistCount: number;
  trackCount: number;
  tracksWithStartTime: number;
  playlists: DJPlaylist[];
  tracks: DJTrack[];
  trackTimes: TrackTime[];
}
