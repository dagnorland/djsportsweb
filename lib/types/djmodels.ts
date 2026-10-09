/**
 * djSports data model — a 1:1 copy of the Flutter app's models
 * (djsports/lib/data/models/*.dart) and their JSON form.
 *
 * Time units (same as Flutter):
 * - DJTrack.startTime   milliseconds into the track where playback starts
 * - DJTrack.startTimeMS extra millisecond offset, normally 0
 *   → playback position = startTime + startTimeMS  (see startPositionMs)
 * - DJTrack.duration    milliseconds
 * - TrackTime.startTime milliseconds (TrackTime.id === DJTrack.id)
 */

/** Dart `enum DJPlaylistType` (the stored value is the enum `.name`). */
export const DJ_PLAYLIST_TYPES = [
  'hotspot',
  'match',
  'funStuff',
  'preMatch',
  'archived',
] as const;
export type DJPlaylistType = (typeof DJ_PLAYLIST_TYPES)[number];

/** Dart `TypeExtension.type` — the label shown in the UI. */
export const DJ_PLAYLIST_TYPE_LABEL: Record<DJPlaylistType, string> = {
  hotspot: 'hotspot',
  match: 'match',
  funStuff: 'fun stuff',
  preMatch: 'pre match',
  archived: 'archived',
};

export function isDJPlaylistType(v: unknown): v is DJPlaylistType {
  return typeof v === 'string' && (DJ_PLAYLIST_TYPES as readonly string[]).includes(v);
}

/** Dart `DJPlaylist` (Hive typeId 0). */
export interface DJPlaylist {
  id: string;                    // UUID v4
  name: string;
  type: string;                  // DJPlaylistType name (kept as string like Dart)
  spotifyUri: string;            // Spotify playlist id/uri, '' if none
  autoNext: boolean;
  shuffleAtEnd: boolean;
  currentTrack: number;          // index into trackIds
  playCount: number;
  trackIds: string[];            // ordered DJTrack ids
  position: number;              // order within its type
  appleMusicPlaylistId: string;  // '' if none
}

/** Dart `DJTrack` (Hive typeId 1). */
export interface DJTrack {
  id: string;                    // Spotify track id, or UUID for Apple Music
  name: string;
  album: string;
  artist: string;
  startTime: number;             // ms
  startTimeMS: number;           // extra ms offset
  duration: number;              // ms
  playCount: number;
  spotifyUri: string;
  mp3Uri: string;
  networkImageUri: string;
  shortcut: string;              // '' or '1'-'9'
  appleMusicId: string;          // '' if none
}

/** Dart `TrackTime` (Hive typeId 2). */
export interface TrackTime {
  id: string;                    // DJTrack.id
  startTime: number;             // ms
  startTimeMS?: number;          // omitted when null (Dart conditional toJson)
}

/** Where playback of a track starts, in ms. */
export function startPositionMs(t: Pick<DJTrack, 'startTime' | 'startTimeMS'>): number {
  return (t.startTime || 0) + (t.startTimeMS || 0);
}

export function hasStartTime(t: Pick<DJTrack, 'startTime' | 'startTimeMS'>): boolean {
  return startPositionMs(t) > 0;
}

/** Firestore `backups/{id}` document — identical to Flutter's CloudBackupService. */
export interface BackupDocument {
  profileName: string;           // "Name|1234"
  spotifyUserId: string;
  spotifyDisplayName: string;
  deviceName: string;
  createdAt: unknown;            // Firestore Timestamp / serverTimestamp()
  version: string;               // '1.0'
  playlistCount: number;
  trackCount: number;
  tracksWithStartTime: number;
  playlists: DJPlaylist[];
  tracks: DJTrack[];
  trackTimes: TrackTime[];
}

/** Dart `CloudBackupSummary`. */
export interface BackupSummary {
  id: string;
  profileName: string;
  spotifyUserId: string;
  spotifyDisplayName: string;
  deviceName: string;
  createdAt: Date;
  playlistCount: number;
  trackCount: number;
  tracksWithStartTime: number;
  version: string;
}
