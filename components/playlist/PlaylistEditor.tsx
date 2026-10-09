"use client";

/**
 * Create / edit a DJ playlist — port of djplaylist_edit_create.dart:
 * name + type, Show/Hide details (Spotify URI with Sync / Search / Browse,
 * Apple Music id, example playlists, Shuffle at end, Auto next, Position,
 * Sync start times, Shuffle), and the track list (play, edit, remove,
 * drag to reorder). Track changes apply immediately; form fields on Update.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ChevronDown, ChevronUp, ListPlus, Loader2, Pause, Play, RefreshCw,
  Search, Shuffle, Timer,
} from "lucide-react";
import {
  DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ConfirmDialog } from "@/components/stage/ConfirmDialog";
import { TrackRow } from "./TrackRow";
import { SpotifyTrackPicker, type PickerMode } from "./SpotifyTrackPicker";
import { EXAMPLE_PLAYLISTS } from "./examplePlaylists";
import { cn } from "@/lib/utils";
import { HOME_TYPE_ORDER, typeLabel, typeText } from "@/lib/theme/playlistTypes";
import { getDb } from "@/lib/db/djsports-db";
import { useLive } from "@/lib/db/useLive";
import { spotifyIdFromUri } from "@/lib/db/codec";
import {
  addTracksToPlaylist, createPlaylist, djTrackFromSpotify, findNewSpotifyTracks, moveTrackInPlaylist,
  normalizeSpotifyUri, removeTrackFromPlaylist, shufflePlaylist, syncMissingStartTimes,
  syncPlaylistFromSpotify, updatePlaylistFromForm, type PlaylistForm,
} from "@/lib/db/playlist-actions";
import { useDJPlayer } from "@/lib/hooks/useDJPlayer";
import { showAppToast } from "@/lib/ui/app-toast";
import type { DJTrack } from "@/lib/types/djmodels";
import type { Track } from "@/lib/types";

const input =
  "h-11 w-full rounded-lg bg-transparent px-3 text-sm border border-input focus:border-2 focus:border-ring outline-none";
const textBtn = "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium hover:bg-stage-high disabled:opacity-40";
const iconBtn = "inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-stage-high disabled:opacity-40";

const EMPTY_FORM: PlaylistForm = {
  name: "", type: "funStuff", spotifyUri: "", appleMusicPlaylistId: "",
  shuffleAtEnd: true, autoNext: true, position: 10,
};

export function PlaylistEditor({ playlistId }: { playlistId: string | null }) {
  const router = useRouter();
  const isNew = !playlistId;
  const player = useDJPlayer();

  const playlist = useLive(() => (playlistId ? getDb().djplaylist.get(playlistId) : Promise.resolve(undefined)), [playlistId]);
  const tracks = useLive(async () => {
    if (!playlistId) return [] as DJTrack[];
    const p = await getDb().djplaylist.get(playlistId);
    if (!p) return [];
    return (await getDb().djtrack.bulkGet(p.trackIds)).filter((t): t is DJTrack => !!t);
  }, [playlistId]);
  const allUris = useLive(async () => (await getDb().djplaylist.toArray()).map(p => p.spotifyUri), []);

  const [form, setForm] = useState<PlaylistForm>(EMPTY_FORM);
  const [positionText, setPositionText] = useState("10");
  const [loaded, setLoaded] = useState(isNew);
  const [showDetails, setShowDetails] = useState(isNew);
  const [busy, setBusy] = useState<string | null>(null);
  const [picker, setPicker] = useState<PickerMode | null>(null);
  const [newTracks, setNewTracks] = useState<Track[] | null>(null);

  // Load the form once from the stored playlist.
  useEffect(() => {
    if (loaded || !playlist) return;
    setForm({
      name: playlist.name, type: playlist.type, spotifyUri: playlist.spotifyUri,
      appleMusicPlaylistId: playlist.appleMusicPlaylistId, shuffleAtEnd: playlist.shuffleAtEnd,
      autoNext: playlist.autoNext, position: playlist.position,
    });
    setPositionText(String(playlist.position));
    setLoaded(true);
  }, [playlist, loaded]);

  // Like Flutter: on open, check the Spotify playlist for new tracks.
  useEffect(() => {
    if (!playlist || !player.token || !playlist.spotifyUri || playlist.trackIds.length >= 100) return;
    let cancelled = false;
    findNewSpotifyTracks(player.token, playlist.id)
      .then(t => { if (!cancelled && t.length) setNewTracks(t); })
      .catch(() => { /* ignore */ });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlist?.id, player.token]);

  const positionError = (() => {
    if (!positionText) return "Value cannot be empty";
    const v = Number(positionText);
    return Number.isInteger(v) && v >= 0 && v <= 99 ? "" : "Value must be between 0 and 99";
  })();

  const set = <K extends keyof PlaylistForm>(k: K, v: PlaylistForm[K]) => setForm(f => ({ ...f, [k]: v }));
  const existingUris = useMemo(() => new Set((tracks ?? []).map(t => t.spotifyUri)), [tracks]);
  const spotifyId = spotifyIdFromUri(form.spotifyUri);
  const usedExampleIds = new Set((allUris ?? []).map(spotifyIdFromUri));

  const save = async () => {
    const f = { ...form, position: Number(positionText) };
    try {
      if (isNew) {
        const p = await createPlaylist(f);
        showAppToast("Playlist created");
        router.replace(`/playlist/${p.id}`);
      } else {
        await updatePlaylistFromForm(playlistId!, f);
        router.push("/home");
      }
    } catch (e) {
      showAppToast(String(e instanceof Error ? e.message : e), { level: "error" });
    }
  };

  /** Flutter: syncing a new playlist creates it from the form first. */
  const ensureSaved = async (): Promise<string | null> => {
    if (!isNew) {
      await updatePlaylistFromForm(playlistId!, { ...form, position: Number(positionText) || 0 });
      return playlistId!;
    }
    try {
      const p = await createPlaylist({ ...form, position: Number(positionText) || 10 });
      return p.id;
    } catch (e) {
      showAppToast(String(e instanceof Error ? e.message : e), { level: "error" });
      return null;
    }
  };

  const doSync = async () => {
    if (!player.token) { showAppToast("Connect Spotify to sync", { level: "warning" }); return; }
    if (!spotifyId) { showAppToast("Paste a Spotify playlist link first", { level: "warning" }); return; }
    const id = await ensureSaved();
    if (!id) return;
    setBusy("Syncronising playlist tracks…");
    try {
      const r = await syncPlaylistFromSpotify(player.token, id);
      showAppToast(`Added ${r.added} tracks, skipped ${r.skipped}. The playlist now has ${r.total} tracks.`);
      if (r.name) set("name", r.name);
      if (isNew) router.replace(`/playlist/${id}`);
    } catch (e) {
      showAppToast("Sync failed", { level: "error", description: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(null);
    }
  };

  const openPicker = async (kind: "search" | "playlist") => {
    if (isNew) { showAppToast("Playlist must be saved before adding tracks", { level: "warning" }); return; }
    setPicker(kind === "search" ? { kind } : { kind, spotifyPlaylistId: spotifyId });
  };

  const pick = async (t: Track) => {
    if (!playlistId) return;
    const r = await addTracksToPlaylist(playlistId, [djTrackFromSpotify(t)]);
    showAppToast(r.added ? `Adding track: ${t.name}` : `${t.name} is already in the playlist`);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const rowIds = (tracks ?? []).map((t, i) => `${i}:${t.id}`);
  const onDragEnd = useCallback((e: DragEndEvent) => {
    if (!playlistId || !e.over || e.active.id === e.over.id) return;
    moveTrackInPlaylist(playlistId, rowIds.indexOf(String(e.active.id)), rowIds.indexOf(String(e.over.id)));
  }, [playlistId, rowIds]);

  if (!isNew && playlist === undefined && !loaded) {
    return <div className="flex min-h-screen items-center justify-center bg-stage-bg"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }
  if (!isNew && loaded && !playlist) {
    return (
      <div className="min-h-screen bg-stage-bg p-6 text-stage-text">
        <Link href="/home" className="text-stage-muted">← Home</Link>
        <p className="mt-4">Playlist not found.</p>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-stage-bg text-stage-text">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 bg-stage-bg px-2">
        <Link href="/home" aria-label="Back" className={iconBtn}><ArrowLeft className="h-6 w-6" /></Link>
        <h1 className="flex-1 text-center text-lg font-bold">{isNew ? "Create Playlist" : "Edit Playlist"}</h1>
        {player.canPlay ? (
          <>
            <button className={iconBtn} onClick={player.resume} aria-label="Play"><Play className="h-5 w-5" /></button>
            <button className={iconBtn} onClick={player.pause} aria-label="Pause"><Pause className="h-5 w-5" /></button>
          </>
        ) : <span className="w-10" />}
      </header>

      <main className="mx-auto max-w-4xl space-y-2 px-3 pb-28">
        {/* Name + Type */}
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <label className="sm:flex-[65]">
            <span className="mb-1 block text-xs text-stage-muted">Playlist name</span>
            <input className={input} value={form.name} placeholder="Enter name" onChange={e => set("name", e.target.value)} />
          </label>
          <label className="sm:flex-[35]">
            <span className="mb-1 block text-xs text-stage-muted">Type</span>
            <select
              className={cn(input, "font-bold uppercase", typeText(form.type))}
              value={form.type}
              onChange={e => set("type", e.target.value)}
            >
              {HOME_TYPE_ORDER.map(t => (
                <option key={t} value={t} className="bg-stage-surface text-stage-text">{typeLabel(t).toUpperCase()}</option>
              ))}
            </select>
          </label>
        </div>

        {/* Details toggle + Cancel / Create|Update */}
        <div className="flex items-center gap-1">
          <button className={textBtn} onClick={() => setShowDetails(v => !v)}>
            {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {showDetails ? "Hide details" : "Show details"}
          </button>
          <span className="flex-1" />
          <button className={textBtn} onClick={() => router.push("/home")}>Cancel</button>
          <button
            className="inline-flex h-9 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-40"
            disabled={!!positionError || !form.name.trim()}
            onClick={save}
          >
            {isNew ? "Create" : "Update"}
          </button>
        </div>

        {showDetails && (
          <div className="space-y-2.5 pt-1">
            {!form.appleMusicPlaylistId && (
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:gap-2">
                <label className="flex-1">
                  <span className="mb-1 block text-xs text-stage-muted">Spotify URI</span>
                  <input className={input} value={form.spotifyUri} placeholder="Paste Spotify playlist link or URI"
                    onChange={e => set("spotifyUri", normalizeSpotifyUri(e.target.value))} />
                </label>
                <div className="flex">
                  {spotifyId && <button className={iconBtn} title="Sync from Spotify playlist" aria-label="Sync from Spotify playlist" onClick={doSync} disabled={!!busy}><RefreshCw className={cn("h-5 w-5", busy && "animate-spin")} /></button>}
                  <button className={iconBtn} title="Search Spotify" aria-label="Search Spotify" onClick={() => openPicker("search")}><Search className="h-5 w-5" /></button>
                  {spotifyId && <button className={iconBtn} title="Browse Spotify playlist tracks" aria-label="Browse Spotify playlist tracks" onClick={() => openPicker("playlist")}><ListPlus className="h-5 w-5" /></button>}
                </div>
              </div>
            )}
            {!form.spotifyUri && (
              <label className="block">
                <span className="mb-1 block text-xs text-stage-muted">Apple Music playlist <span className="text-stage-muted/70">(kept for the app — no Apple Music playback on the web)</span></span>
                <input className={input} value={form.appleMusicPlaylistId} placeholder="Apple Music playlist link or ID"
                  onChange={e => set("appleMusicPlaylistId", e.target.value)} />
              </label>
            )}
            {!form.spotifyUri && !form.appleMusicPlaylistId && (
              <select className={input} value="" onChange={e => {
                const ex = EXAMPLE_PLAYLISTS.find(x => x.uri === e.target.value);
                if (!ex) return;
                setForm(f => ({ ...f, spotifyUri: ex.uri, type: ex.type, name: f.name || ex.name }));
              }}>
                <option value="">Use an example playlist…</option>
                {EXAMPLE_PLAYLISTS.filter(x => !usedExampleIds.has(spotifyIdFromUri(x.uri))).map(x => (
                  <option key={x.uri} value={x.uri} className="bg-stage-surface">{typeLabel(x.type).toUpperCase()} – {x.name || spotifyIdFromUri(x.uri)}</option>
                ))}
              </select>
            )}

            {/* Settings row */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-[10px] border border-stage-text/15 bg-stage-text/[0.04] px-3 py-2.5 text-sm">
              <label className="flex items-center gap-1.5">
                <input type="checkbox" className="h-4 w-4 accent-current" checked={form.shuffleAtEnd} onChange={e => set("shuffleAtEnd", e.target.checked)} /> Shuffle at end
              </label>
              <label className="flex items-center gap-1.5">
                <input type="checkbox" className="h-4 w-4 accent-current" checked={form.autoNext} onChange={e => set("autoNext", e.target.checked)} /> Auto next
              </label>
              <label className="flex items-center gap-2">
                Position
                <input className="h-8 w-14 rounded-md border border-input bg-transparent px-2 text-center" inputMode="numeric" maxLength={2}
                  value={positionText} placeholder="0–99" onChange={e => setPositionText(e.target.value.replace(/\D/g, "").slice(0, 2))} />
              </label>
              <span className="ml-auto font-semibold">Tracks: {tracks?.length ?? 0}</span>
            </div>
            {positionError && <p className="text-xs text-red-500">{positionError}</p>}

            {!isNew && (
              <div className="flex gap-1">
                <button className={textBtn} onClick={async () => {
                  const n = await syncMissingStartTimes(playlistId!);
                  showAppToast(`Updated ${n} tracks`);
                }}><Timer className="h-4 w-4" /> Sync start times</button>
                <button className={textBtn} onClick={() => shufflePlaylist(playlistId!)}><Shuffle className="h-4 w-4" /> Shuffle</button>
              </div>
            )}
          </div>
        )}

        <hr className="!my-3 border-stage-divider" />

        {busy && <p className="flex items-center gap-2 text-sm text-stage-muted"><Loader2 className="h-4 w-4 animate-spin" /> {busy}</p>}

        {isNew ? (
          <p className="text-sm text-stage-muted">Create the playlist (or Sync from a Spotify link) to add tracks.</p>
        ) : (tracks?.length ?? 0) === 0 ? (
          <p className="text-sm text-stage-muted">No tracks yet — Sync from Spotify, or Search to add tracks.</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
              <ul className="space-y-0.5">
                {tracks!.map((t, i) => (
                  <TrackRow
                    key={rowIds[i]}
                    id={rowIds[i]}
                    track={t}
                    counter={i + 1}
                    playlistType={form.type}
                    onPlay={() => player.play(t)}
                    onEdit={() => router.push(`/playlist/${playlistId}/track/${i}`)}
                    onDelete={() => removeTrackFromPlaylist(playlistId!, i)}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </main>

      <SpotifyTrackPicker mode={picker} token={player.token} existingUris={existingUris} onPick={pick} onClose={() => setPicker(null)} />
      <ConfirmDialog
        options={newTracks ? {
          title: "New tracks found",
          message: `Found ${newTracks.length} new track${newTracks.length === 1 ? "" : "s"} in the Spotify playlist. Add them?`,
          confirmLabel: "Add",
        } : null}
        onResult={async ok => {
          const list = newTracks;
          setNewTracks(null);
          if (ok && list && playlistId) {
            const r = await addTracksToPlaylist(playlistId, list.map(djTrackFromSpotify));
            showAppToast(`Added ${r.added} tracks`);
          }
        }}
      />
    </div>
  );
}
