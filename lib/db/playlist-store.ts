import { getDb } from './djsports-db';
import type { DJPlaylist } from '@/lib/types/djmodels';
import type { SimplifiedPlaylist } from '@/lib/types';

export async function upsertPlaylistFromSpotify(
  spotifyPlaylist: SimplifiedPlaylist,
  position: number,
  trackIds: string[] = []
): Promise<void> {
  const db = getDb();

  // Check existing record to preserve type, playCount, currentTrack etc.
  const existing = await db.playlists.get(spotifyPlaylist.id);

  // Resolve type: prefer existing Dexie value, then legacy table, then 'none'
  let type = existing?.type ?? 'none';
  if (type === 'none') {
    const legacy = await db.legacyPlaylistTypes.get(spotifyPlaylist.id);
    if (legacy) {
      type = legacy.type;
    }
  }

  const record: DJPlaylist = {
    id: spotifyPlaylist.id,
    name: spotifyPlaylist.name,
    type,
    spotifyUri: spotifyPlaylist.uri,
    autoNext: existing?.autoNext ?? true,
    shuffleAtEnd: existing?.shuffleAtEnd ?? false,
    currentTrack: existing?.currentTrack ?? 0,
    playCount: existing?.playCount ?? 0,
    trackIds: trackIds.length > 0 ? trackIds : (existing?.trackIds ?? []),
    position,
  };

  await db.playlists.put(record);
}

export async function setPlaylistType(id: string, type: string): Promise<void> {
  const db = getDb();
  const existing = await db.playlists.get(id);
  if (existing) {
    existing.type = type;
    await db.playlists.put(existing);
  } else {
    // Playlist not yet populated from Spotify; store in legacy table for now
    await db.legacyPlaylistTypes.put({ id, type });
  }
}

export async function getPlaylistType(id: string): Promise<string | null> {
  const db = getDb();
  const playlist = await db.playlists.get(id);
  if (playlist) return playlist.type !== 'none' ? playlist.type : null;
  const legacy = await db.legacyPlaylistTypes.get(id);
  return legacy?.type ?? null;
}

export async function getAllPlaylists(): Promise<DJPlaylist[]> {
  return getDb().playlists.orderBy('position').toArray();
}

export async function updatePlaylistTrackIds(playlistId: string, trackIds: string[]): Promise<void> {
  const db = getDb();
  const existing = await db.playlists.get(playlistId);
  if (existing) {
    existing.trackIds = trackIds;
    await db.playlists.put(existing);
  }
}

export async function clearAllPlaylists(): Promise<void> {
  return getDb().playlists.clear();
}
