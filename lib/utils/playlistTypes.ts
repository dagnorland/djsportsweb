/**
 * DJ playlist type helpers for the old Spotify-keyed pages.
 * Backed by the Flutter-model DB via lib/db/legacy-bridge (temporary).
 */
import { DJPlaylistType } from "@/lib/types";

export const savePlaylistType = (playlistId: string, playlistType: DJPlaylistType, name = ''): void => {
  if (typeof window === 'undefined') return;
  import('@/lib/db/legacy-bridge').then(({ setPlaylistTypeBySpotifyId }) =>
    setPlaylistTypeBySpotifyId(playlistId, playlistType, name)
  ).catch(err => console.error('Failed to save playlist type:', err));
};

export const getPlaylistType = async (playlistId: string): Promise<DJPlaylistType | null> => {
  if (typeof window === 'undefined') return null;
  const { getPlaylistTypeBySpotifyId } = await import('@/lib/db/legacy-bridge');
  return ((await getPlaylistTypeBySpotifyId(playlistId)) as DJPlaylistType) ?? null;
};

export const removePlaylistType = (playlistId: string): void => {
  savePlaylistType(playlistId, 'none');
};

/** Map: Spotify playlist id (or DJ id when not linked) → type. */
export const getAllPlaylistTypes = async (): Promise<Record<string, DJPlaylistType>> => {
  if (typeof window === 'undefined') return {};
  const { getAllPlaylists } = await import('@/lib/db/legacy-bridge');
  const result: Record<string, DJPlaylistType> = {};
  for (const p of await getAllPlaylists()) {
    if (p.type) result[p.id] = p.type as DJPlaylistType;
  }
  return result;
};

export const getPlaylistTypeOptions = (): { value: DJPlaylistType; label: string }[] => [
  { value: "none", label: "Ingen" },
  { value: "hotspot", label: "Hotspot" },
  { value: "match", label: "Match" },
  { value: "funStuff", label: "Fun Stuff" },
  { value: "preMatch", label: "Pre Match" },
];
