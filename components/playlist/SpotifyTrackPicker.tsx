"use client";

/**
 * Pick a track from Spotify: search the catalogue, or browse the linked
 * Spotify playlist (tracks already in the DJ playlist are marked).
 * Port of SpotifySearchDelegate / SpotifyPlaylistTrackDelegate.
 */
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { Check, Loader2, Plus, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getPlaylistTracks, searchTracks } from "@/lib/spotify/dj-client";
import { formatDuration } from "@/lib/utils/formatTime";
import type { Track } from "@/lib/types";

export type PickerMode = { kind: "search" } | { kind: "playlist"; spotifyPlaylistId: string };

export function SpotifyTrackPicker({
  mode, token, existingUris, onPick, onClose,
}: {
  mode: PickerMode | null;
  token?: string;
  existingUris: Set<string>;
  onPick: (t: Track) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setItems([]); setError(null); setQuery("");
    if (mode?.kind === "playlist" && token) {
      setLoading(true);
      getPlaylistTracks(token, mode.spotifyPlaylistId)
        .then(setItems).catch(e => setError(String(e?.message ?? e))).finally(() => setLoading(false));
    }
  }, [mode, token]);

  useEffect(() => {
    if (mode?.kind !== "search" || !token) return;
    const q = query.trim();
    if (!q) { setItems([]); return; }
    const h = setTimeout(() => {
      setLoading(true);
      searchTracks(token, q).then(setItems).catch(e => setError(String(e?.message ?? e))).finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(h);
  }, [query, mode, token]);

  const filtered = mode?.kind === "playlist" && query.trim()
    ? items.filter(t => `${t.name} ${t.artists?.map(a => a.name).join(" ")}`.toLowerCase().includes(query.toLowerCase()))
    : items;

  return (
    <Dialog open={!!mode} onOpenChange={o => { if (!o) onClose(); }}>
      <DialogContent className="max-w-xl border-stage-divider bg-stage-surface text-stage-text">
        <DialogHeader>
          <DialogTitle>{mode?.kind === "playlist" ? "Spotify playlist tracks" : "Search Spotify"}</DialogTitle>
        </DialogHeader>
        {!token ? (
          <p className="text-sm text-stage-muted">Connect Spotify first.</p>
        ) : (
          <>
            <label className="flex h-10 items-center gap-2 rounded-lg border border-input px-3 focus-within:border-ring">
              <Search className="h-4 w-4 text-stage-muted" />
              <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
                placeholder={mode?.kind === "playlist" ? "Filter" : "Song, artist or album"}
                className="flex-1 bg-transparent text-sm outline-none" />
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            </label>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <ul className="max-h-[60vh] space-y-1 overflow-y-auto">
              {filtered.map(t => {
                const have = existingUris.has(t.uri);
                return (
                  <li key={t.id}>
                    <button disabled={have} onClick={() => onPick(t)}
                      className="flex w-full items-center gap-3 rounded-lg p-1.5 text-left hover:bg-stage-high disabled:opacity-50">
                      <img src={t.album?.images?.[t.album.images.length - 1]?.url ?? ""} alt="" className="h-10 w-10 rounded bg-stage-high object-cover" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{t.name}</span>
                        <span className="block truncate text-xs text-stage-muted">{t.artists?.map(a => a.name).join(", ")} · {formatDuration(t.duration_ms)}</span>
                      </span>
                      {have ? <Check className="h-4 w-4 text-green-500" /> : <Plus className="h-4 w-4" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
