/**
 * Pure backup logic shared by the Firestore service and tests.
 * Mirrors djsports/lib/data/services/cloud_backup_service.dart.
 */
import type { BackupDocument, DJPlaylist, DJTrack, TrackTime } from '@/lib/types/djmodels';
import { hasStartTime } from '@/lib/types/djmodels';
import {
  playlistFromJson, playlistToJson,
  trackFromJson, trackToJson,
  trackTimeFromJson, trackTimeToJson,
} from '@/lib/db/codec';

export const BACKUP_VERSION = '1.0';
export const MAX_BACKUPS_PER_DEVICE = 5;

export interface LocalData {
  playlists: DJPlaylist[];
  tracks: DJTrack[];
  trackTimes: TrackTime[];
}

export interface BackupMeta {
  profileName: string;
  spotifyUserId: string;
  spotifyDisplayName: string;
  deviceName: string;
}

/** The document written to Firestore (createdAt is set by the caller). */
export function buildBackupDocument(
  data: LocalData,
  meta: BackupMeta,
  createdAt: unknown,
): BackupDocument {
  return {
    profileName: meta.profileName,
    spotifyUserId: meta.spotifyUserId,
    spotifyDisplayName: meta.spotifyDisplayName,
    deviceName: meta.deviceName,
    createdAt,
    version: BACKUP_VERSION,
    playlistCount: data.playlists.length,
    trackCount: data.tracks.length,
    tracksWithStartTime: data.tracks.filter(hasStartTime).length,
    playlists: data.playlists.map(playlistToJson) as unknown as DJPlaylist[],
    tracks: data.tracks.map(trackToJson) as unknown as DJTrack[],
    trackTimes: data.trackTimes.map(trackTimeToJson) as unknown as TrackTime[],
  };
}

/** Parses a backup's lists with Flutter's defaults; skips broken entries. */
export function parseBackupData(raw: Record<string, unknown>, warn?: (m: string) => void): LocalData {
  const list = (v: unknown) => (Array.isArray(v) ? v : []);
  const playlists: DJPlaylist[] = [];
  for (const p of list(raw.playlists)) {
    if (p && typeof p === 'object') playlists.push(playlistFromJson(p as Record<string, unknown>));
    else warn?.('Warning: skipped a playlist');
  }
  const tracks: DJTrack[] = [];
  for (const t of list(raw.tracks)) {
    if (!t || typeof t !== 'object') { warn?.('Warning: skipped a track'); continue; }
    const track = trackFromJson(t as Record<string, unknown>);
    if (track.id) tracks.push(track);
  }
  const trackTimes: TrackTime[] = [];
  for (const tt of list(raw.trackTimes)) {
    if (tt && typeof tt === 'object') {
      const parsed = trackTimeFromJson(tt as Record<string, unknown>);
      if (parsed.id) trackTimes.push(parsed);
    }
  }
  return { playlists, tracks, trackTimes };
}

export interface SyncPlan {
  playlists: DJPlaylist[];
  tracks: DJTrack[];
  trackTimes: TrackTime[];
  added: number;
  skipped: number;
}

/**
 * Dart `syncBackup`: add backup playlists that don't exist locally (matched
 * on non-empty spotifyUri or appleMusicPlaylistId), plus their tracks and
 * timings that aren't local yet. Existing playlists are left untouched.
 */
export function planSync(local: LocalData, backup: LocalData): SyncPlan {
  const localUris = new Set(local.playlists.map(p => p.spotifyUri).filter(Boolean));
  const localApple = new Set(local.playlists.map(p => p.appleMusicPlaylistId).filter(Boolean));
  const localTrackIds = new Set(local.tracks.map(t => t.id));
  const localTtIds = new Set(local.trackTimes.map(t => t.id));
  const ttById = new Map(backup.trackTimes.map(t => [t.id, t]));
  const added = new Set<string>();

  const plan: SyncPlan = { playlists: [], tracks: [], trackTimes: [], added: 0, skipped: 0 };
  for (const p of backup.playlists) {
    const exists =
      (p.spotifyUri && localUris.has(p.spotifyUri)) ||
      (p.appleMusicPlaylistId && localApple.has(p.appleMusicPlaylistId));
    if (exists) { plan.skipped++; continue; }
    plan.playlists.push(p);
    const ids = new Set(p.trackIds);
    for (const t of backup.tracks) {
      if (!ids.has(t.id) || localTrackIds.has(t.id) || added.has(t.id)) continue;
      plan.tracks.push(t);
      added.add(t.id);
      const tt = ttById.get(t.id);
      if (tt && !localTtIds.has(tt.id)) plan.trackTimes.push(tt);
    }
    plan.added++;
  }
  return plan;
}
