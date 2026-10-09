/**
 * JSON <-> model conversion with the same defaults as Flutter's generated
 * fromJson/toJson (djplaylist_model.g.dart, djtrack_model.g.dart,
 * track_time_model.dart). Pure functions — used by the DB, backups and tests.
 */
import type { DJPlaylist, DJTrack, TrackTime } from '@/lib/types/djmodels';

type Json = Record<string, unknown>;

const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const int = (v: unknown): number =>
  typeof v === 'number' && Number.isFinite(v) ? Math.trunc(v) : 0;
const bool = (v: unknown, d: boolean): boolean => (typeof v === 'boolean' ? v : d);

export function playlistFromJson(j: Json): DJPlaylist {
  return {
    id: str(j.id),
    name: str(j.name),
    type: str(j.type),
    spotifyUri: str(j.spotifyUri),
    autoNext: bool(j.autoNext, true),
    shuffleAtEnd: bool(j.shuffleAtEnd, false),
    currentTrack: int(j.currentTrack),
    playCount: int(j.playCount),
    trackIds: Array.isArray(j.trackIds) ? j.trackIds.filter((x): x is string => typeof x === 'string') : [],
    position: int(j.position),
    appleMusicPlaylistId: str(j.appleMusicPlaylistId),
  };
}

export function playlistToJson(p: DJPlaylist): Json {
  return {
    id: p.id,
    name: p.name,
    type: p.type,
    spotifyUri: p.spotifyUri,
    autoNext: p.autoNext,
    shuffleAtEnd: p.shuffleAtEnd,
    currentTrack: p.currentTrack,
    playCount: p.playCount,
    trackIds: [...p.trackIds],
    position: p.position,
    appleMusicPlaylistId: p.appleMusicPlaylistId,
  };
}

/** Same null guards as CloudBackupService.restoreBackup in Flutter. */
export function trackFromJson(j: Json): DJTrack {
  return {
    id: str(j.id),
    name: str(j.name),
    album: str(j.album),
    artist: str(j.artist),
    startTime: int(j.startTime),
    startTimeMS: int(j.startTimeMS),
    duration: int(j.duration),
    playCount: int(j.playCount),
    spotifyUri: str(j.spotifyUri),
    mp3Uri: str(j.mp3Uri),
    networkImageUri: str(j.networkImageUri),
    shortcut: str(j.shortcut),
    appleMusicId: str(j.appleMusicId),
  };
}

export function trackToJson(t: DJTrack): Json {
  return {
    id: t.id,
    name: t.name,
    album: t.album,
    artist: t.artist,
    startTime: t.startTime,
    startTimeMS: t.startTimeMS,
    duration: t.duration,
    playCount: t.playCount,
    spotifyUri: t.spotifyUri,
    mp3Uri: t.mp3Uri,
    networkImageUri: t.networkImageUri,
    shortcut: t.shortcut,
    appleMusicId: t.appleMusicId,
  };
}

export function trackTimeFromJson(j: Json): TrackTime {
  const tt: TrackTime = { id: str(j.id), startTime: int(j.startTime) };
  if (typeof j.startTimeMS === 'number') tt.startTimeMS = Math.trunc(j.startTimeMS);
  return tt;
}

export function trackTimeToJson(t: TrackTime): Json {
  return {
    id: t.id,
    startTime: t.startTime,
    ...(t.startTimeMS != null ? { startTimeMS: t.startTimeMS } : {}),
  };
}

/** Dart `TrackTime.fromDJTrack`. */
export function trackTimeFromTrack(t: DJTrack): TrackTime {
  return { id: t.id, startTime: t.startTime, startTimeMS: t.startTimeMS };
}

/**
 * Spotify id from "spotify:playlist:ID", "playlist/ID", "playlist:ID",
 * an open.spotify.com link, "ID?si=…" or a bare "ID".
 */
export function spotifyIdFromUri(uri: string): string {
  return (uri ?? '').split('?')[0].split(/[:/]/).filter(Boolean).pop()?.trim() ?? '';
}
