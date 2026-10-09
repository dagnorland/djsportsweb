/**
 * TEMPORARY bridge for the old /playlists and /match pages, which key
 * everything by Spotify playlist id. It exposes the Flutter-model data in
 * that shape. Removed when Home (§4) and Let's Play (§5) replace those pages.
 */
import type { DJPlaylist, DJPlaylistType } from '@/lib/types/djmodels';
import { spotifyIdFromUri } from './codec';
import {
  addDJPlaylist, getDJPlaylistBySpotifyId, getDJPlaylists, simplePlaylist,
  updateDJPlaylist,
} from './playlist-repo';
import { getDJTracks } from './track-repo';

/** Playlists with `id` replaced by the linked Spotify playlist id (if any). */
export async function getAllPlaylists(): Promise<DJPlaylist[]> {
  const all = await getDJPlaylists();
  return all.map(p => ({ ...p, id: spotifyIdFromUri(p.spotifyUri) || p.id }));
}

export async function updatePlaylistTrackIds(spotifyId: string, trackIds: string[]): Promise<void> {
  const p = await getDJPlaylistBySpotifyId(spotifyId);
  if (p) await updateDJPlaylist({ ...p, trackIds });
}

export async function setPlaylistTypeBySpotifyId(spotifyId: string, type: string, name = ''): Promise<void> {
  const p = await getDJPlaylistBySpotifyId(spotifyId);
  if (p) {
    await updateDJPlaylist({ ...p, type: type === 'none' ? 'archived' : type });
  } else if (type !== 'none') {
    await addDJPlaylist({ ...simplePlaylist(name, type as DJPlaylistType), spotifyUri: spotifyId });
  }
}

export async function getPlaylistTypeBySpotifyId(spotifyId: string): Promise<string | null> {
  return (await getDJPlaylistBySpotifyId(spotifyId))?.type ?? null;
}

export const getAllTracks = getDJTracks;
