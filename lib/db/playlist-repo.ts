/** Port of Flutter `DJPlaylistRepo` + `DJPlaylistHive` controller logic. */
import { getDb } from './djsports-db';
import type { DJPlaylist, DJPlaylistType } from '@/lib/types/djmodels';
import { spotifyIdFromUri } from './codec';

export function newId(): string {
  return crypto.randomUUID();
}

/** Dart `DJPlaylist.simple`. */
export function simplePlaylist(name: string, type: DJPlaylistType): DJPlaylist {
  return {
    id: newId(),
    name,
    type,
    spotifyUri: '',
    autoNext: true,
    shuffleAtEnd: false,
    currentTrack: 0,
    playCount: 0,
    trackIds: [],
    position: 0,
    appleMusicPlaylistId: '',
  };
}

/** All playlists, ordered by type then position. */
export async function getDJPlaylists(): Promise<DJPlaylist[]> {
  const all = await getDb().djplaylist.toArray();
  return all.sort((a, b) => a.type.localeCompare(b.type) || a.position - b.position);
}

export async function getDJPlaylist(id: string): Promise<DJPlaylist | undefined> {
  return getDb().djplaylist.get(id);
}

/** Finds the playlist linked to a Spotify playlist (any uri form). */
export async function getDJPlaylistBySpotifyId(spotifyId: string): Promise<DJPlaylist | undefined> {
  const id = spotifyIdFromUri(spotifyId);
  if (!id) return undefined;
  const all = await getDb().djplaylist.toArray();
  return all.find(p => p.spotifyUri && spotifyIdFromUri(p.spotifyUri) === id);
}

/** Throws like Flutter when a non-empty spotifyUri is already used. */
export async function addDJPlaylist(p: DJPlaylist): Promise<DJPlaylist> {
  const db = getDb();
  if (p.spotifyUri) {
    const dup = await getDJPlaylistBySpotifyId(p.spotifyUri);
    if (dup) throw new Error(`Playlist ${dup.name} has same spotify uri`);
  }
  const record = { ...p, id: p.id || newId() };
  await db.djplaylist.add(record);
  return record;
}

export async function updateDJPlaylist(p: DJPlaylist): Promise<DJPlaylist> {
  await getDb().djplaylist.put(p);
  return p;
}

/** Removes the playlist and its tracks that no other playlist uses. */
export async function removeDJPlaylist(id: string): Promise<void> {
  const db = getDb();
  await db.transaction('rw', db.djplaylist, db.djtrack, async () => {
    const all = await db.djplaylist.toArray();
    const target = all.find(p => p.id === id);
    if (!target) return;
    const usedElsewhere = new Set(all.filter(p => p.id !== id).flatMap(p => p.trackIds));
    const orphans = target.trackIds.filter(t => !usedElsewhere.has(t));
    await db.djtrack.bulkDelete(orphans);
    await db.djplaylist.delete(id);
  });
}

/** Dart `reorderPlaylistsOfType` (Flutter ReorderableList index semantics). */
export async function reorderPlaylistsOfType(type: string, oldIndex: number, newIndex: number): Promise<void> {
  const db = getDb();
  const list = (await db.djplaylist.where('type').equals(type).toArray())
    .sort((a, b) => a.position - b.position);
  if (newIndex > oldIndex) newIndex -= 1;
  const [item] = list.splice(oldIndex, 1);
  list.splice(newIndex, 0, item);
  list.forEach((p, i) => { p.position = i; });
  await db.djplaylist.bulkPut(list);
}

/** Moves a playlist within its type (array-move semantics, as dnd-kit). */
export async function movePlaylistInType(type: string, from: number, to: number): Promise<void> {
  if (from === to) return;
  // reorderPlaylistsOfType uses Flutter's ReorderableList indices.
  await reorderPlaylistsOfType(type, from, to > from ? to + 1 : to);
}

export async function setPlaylistType(id: string, type: string): Promise<void> {
  await getDb().djplaylist.update(id, { type });
}

export async function deleteAllPlaylists(): Promise<void> {
  await getDb().djplaylist.clear();
}
