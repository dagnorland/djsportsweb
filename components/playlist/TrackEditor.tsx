"use client";

/**
 * Track editor — port of djtrack_edit_create.dart: metadata, start-time
 * slider with preview (play / pause / auto preview / volume, live position
 * with "Set as start"), Update / Update & next, previous / next steps.
 */
/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, Music, Pause, Play, Volume1, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDb } from "@/lib/db/djsports-db";
import { useLive } from "@/lib/db/useLive";
import { updateDJTrack } from "@/lib/db/track-repo";
import { useDJPlayer } from "@/lib/hooks/useDJPlayer";
import { getPlaybackPosition, getVolume, setVolume } from "@/lib/spotify/dj-client";
import { formatDuration, formatMs } from "@/lib/utils/formatTime";
import { startPositionMs, type DJTrack } from "@/lib/types/djmodels";
import { StartTimeSlider } from "./StartTimeSlider";

const input = "h-11 w-full rounded-lg bg-transparent px-3 text-sm border border-input focus:border-2 focus:border-ring outline-none";
const section = "rounded-[10px] border border-stage-text/15 bg-stage-text/[0.04] px-4 py-3";
const iconBtn = "inline-flex items-center justify-center rounded-full hover:bg-stage-high disabled:opacity-30";

function Cover({ uri, size }: { uri: string; size: number }) {
  return (
    <span className="block shrink-0 overflow-hidden rounded-md bg-stage-high" style={{ width: size, height: size }}>
      {uri ? <img src={uri} alt="" className="h-full w-full object-cover" /> : <Music className="m-auto mt-[30%] h-1/3 w-1/3 text-stage-text/25" />}
    </span>
  );
}

function NeighbourCard({ track, label, position, isNext, href }: { track: DJTrack; label: string; position: number; isNext: boolean; href: string }) {
  const ms = startPositionMs(track);
  return (
    <Link href={href} className={cn("flex items-center gap-3 rounded-xl bg-stage-surface p-3 hover:bg-stage-high", isNext && "flex-row-reverse text-right")}>
      {isNext ? <ChevronRight className="h-8 w-8 shrink-0" /> : <ChevronLeft className="h-8 w-8 shrink-0" />}
      <Cover uri={track.networkImageUri} size={72} />
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-stage-muted">{label} · {position}</span>
        <span className="block truncate font-bold">{track.name}</span>
        <span className="block truncate text-sm text-stage-muted">{track.artist}</span>
        <span className="block text-xs text-stage-muted">{ms > 0 ? `Start ${formatDuration(ms)}` : "No start time"}</span>
      </span>
    </Link>
  );
}

export function TrackEditor({ playlistId, index }: { playlistId: string; index: number }) {
  const router = useRouter();
  const params = useSearchParams();
  const player = useDJPlayer();

  const data = useLive(async () => {
    const p = await getDb().djplaylist.get(playlistId);
    if (!p) return null;
    const tracks = (await getDb().djtrack.bulkGet(p.trackIds)).filter((t): t is DJTrack => !!t);
    return { playlist: p, tracks };
  }, [playlistId]);

  const track = data?.tracks[index];
  const [name, setName] = useState("");
  const [album, setAlbum] = useState("");
  const [artist, setArtist] = useState("");
  const [spotifyUri, setSpotifyUri] = useState("");
  const [startMs, setStartMs] = useState(0);
  const [autoPreview, setAutoPreview] = useState(params?.get("preview") === "1");
  const [livePos, setLivePos] = useState(0);
  const [polling, setPolling] = useState(false);
  const [volume, setVol] = useState<number | null>(null);
  const loadedFor = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    if (!track || loadedFor.current === track.id) return;
    loadedFor.current = track.id;
    setName(track.name); setAlbum(track.album); setArtist(track.artist); setSpotifyUri(track.spotifyUri);
    setStartMs(startPositionMs(track));
    setLivePos(0);
  }, [track]);

  useEffect(() => {
    if (player.token) getVolume(player.token).then(setVol).catch(() => {});
  }, [player.token]);

  const stopPolling = useCallback(() => { clearInterval(timer.current); timer.current = undefined; setPolling(false); }, []);
  const startPolling = useCallback(() => {
    if (!player.token) return;
    clearInterval(timer.current);
    setPolling(true);
    const tok = player.token;
    timer.current = setInterval(() => {
      getPlaybackPosition(tok).then(s => { if (s) setLivePos(s.progressMs); }).catch(() => {});
    }, 500);
  }, [player.token]);
  useEffect(() => () => clearInterval(timer.current), []);

  if (data === undefined) return <div className="flex min-h-screen items-center justify-center bg-stage-bg"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!data || !track) {
    return (
      <div className="min-h-screen bg-stage-bg p-6 text-stage-text">
        <Link href={`/playlist/${playlistId}`} className="text-stage-muted">← Playlist</Link>
        <p className="mt-4">Track not found.</p>
      </div>
    );
  }

  const count = data.tracks.length;
  const maxMs = track.duration > 0 ? track.duration : 300000;
  const preview = { ...track, spotifyUri };
  const trackHref = (i: number) => `/playlist/${playlistId}/track/${i}${autoPreview ? "?preview=1" : ""}`;

  /** Flutter: whole seconds into startTime (ms), tenths into startTimeMS. */
  const split = (ms: number) => ({ startTime: Math.floor(ms / 1000) * 1000, startTimeMS: Math.floor((ms % 1000) / 100) * 100 });
  const quantized = (() => { const s = split(startMs); return s.startTime + s.startTimeMS; })();

  const play = () => { player.play(preview, quantized).then(ok => { if (ok) startPolling(); }); };
  const pause = () => { player.pause(); stopPolling(); };
  const onSliderEnd = (ms: number) => {
    if (!autoPreview) return;
    const s = split(ms);
    player.play(preview, s.startTime + s.startTimeMS).then(ok => { if (ok) startPolling(); });
  };
  const nudge = (d: number) => {
    const ms = Math.min(maxMs, Math.max(0, quantized + d));
    setStartMs(ms);
    onSliderEnd(ms);
  };
  const go = (i: number) => {
    if (polling) player.pause();
    stopPolling();
    router.push(trackHref(i));
  };
  const save = async (next: boolean) => {
    await updateDJTrack({ ...track, name, album, artist, spotifyUri, ...split(startMs) });
    if (polling) player.pause();
    stopPolling();
    if (next && index + 1 < count) router.push(trackHref(index + 1));
    else router.push(`/playlist/${playlistId}`);
  };
  const changeVolume = (d: number) => {
    if (!player.token || volume == null) return;
    const v = Math.max(0, Math.min(100, volume + d));
    setVol(v);
    setVolume(player.token, v).catch(() => {});
  };

  return (
    <div className="min-h-screen bg-stage-bg text-stage-text">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-1 bg-stage-bg px-2">
        <Link href={`/playlist/${playlistId}`} aria-label="Back" className={cn(iconBtn, "h-10 w-10")}><ArrowLeft className="h-6 w-6" /></Link>
        <div className="min-w-0 flex-1 text-center leading-tight">
          <h1 className="truncate font-bold">{track.name}</h1>
          <p className="truncate text-xs text-stage-muted">{data.playlist.name}</p>
        </div>
        <button className={cn(iconBtn, "h-11 w-11")} disabled={index <= 0} onClick={() => go(index - 1)} aria-label="Previous track"><ChevronLeft className="h-8 w-8" /></button>
        <span className="px-1.5 text-center leading-none">
          <span className="block text-base font-extrabold">{index + 1}</span>
          <span className="block text-[11px] font-semibold">of {count}</span>
        </span>
        <button className={cn(iconBtn, "h-11 w-11")} disabled={index >= count - 1} onClick={() => go(index + 1)} aria-label="Next track"><ChevronRight className="h-8 w-8" /></button>
      </header>

      <main className="mx-auto max-w-4xl space-y-3 px-4 pb-28 pt-2">
        <div className={cn(section, "flex items-center gap-4")}>
          <span className="hidden min-[800px]:block"><Cover uri={track.networkImageUri} size={128} /></span>
          <div className="flex-1 space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <label><span className="mb-1 block text-xs text-stage-muted">Name</span><input className={input} value={name} onChange={e => setName(e.target.value)} placeholder="Track name" /></label>
              <label><span className="mb-1 block text-xs text-stage-muted">Album</span><input className={input} value={album} onChange={e => setAlbum(e.target.value)} placeholder="Album name" /></label>
              <label><span className="mb-1 block text-xs text-stage-muted">Artist</span><input className={input} value={artist} onChange={e => setArtist(e.target.value)} placeholder="Artist name" /></label>
            </div>
            <label className="block"><span className="mb-1 block text-xs text-stage-muted">Spotify URI</span><input className={input} value={spotifyUri} onChange={e => setSpotifyUri(e.target.value)} placeholder="spotify:track:..." /></label>
          </div>
        </div>

        <div className={section}>
          <div className="flex flex-wrap items-center gap-1">
            <button className={cn(iconBtn, "h-12 w-12")} onClick={play} aria-label="Play preview"><Play className="h-8 w-8" fill="currentColor" /></button>
            <button className={cn(iconBtn, "h-12 w-12")} onClick={pause} aria-label="Pause"><Pause className="h-8 w-8" fill="currentColor" /></button>
            <span className="flex-1" />
            <label className="flex items-center gap-1.5 text-sm">
              <input type="checkbox" className="h-4 w-4" checked={autoPreview} onChange={e => setAutoPreview(e.target.checked)} /> Auto Preview
            </label>
            {volume != null && (
              <span className="ml-3 flex items-center">
                <button className={cn(iconBtn, "h-10 w-10")} onClick={() => changeVolume(-5)} title="Volume -5%"><Volume1 className="h-6 w-6" /></button>
                <span className="w-11 text-center text-sm font-semibold tabular-nums">{volume}%</span>
                <button className={cn(iconBtn, "h-10 w-10")} onClick={() => changeVolume(5)} title="Volume +5%"><Volume2 className="h-6 w-6" /></button>
              </span>
            )}
          </div>
          <StartTimeSlider valueMs={startMs} maxMs={maxMs} onChange={setStartMs} onChangeEnd={onSliderEnd} onNudge={nudge} />
          <div className="mt-1 flex h-7 items-center gap-1.5 text-[13px]">
            {livePos > 0 && (
              <>
                <span className={cn("h-2 w-2 rounded-full", polling ? "bg-green-500" : "bg-stage-muted")} />
                <span className="font-semibold tabular-nums">{formatMs(livePos)}</span>
                <span className="text-[11px] text-stage-muted">{polling ? "now playing" : "paused at"}</span>
                {!polling && (
                  <button className="ml-2 rounded-full px-2 py-0.5 text-xs hover:bg-stage-high" onClick={() => setStartMs(livePos)}>Set as start</button>
                )}
              </>
            )}
            <span className="ml-auto text-xs text-stage-muted">Duration {formatDuration(track.duration)}</span>
          </div>
        </div>

        <div className="flex justify-center gap-1">
          <Link href={`/playlist/${playlistId}`} className="inline-flex h-10 items-center rounded-full px-4 text-sm font-medium hover:bg-stage-high">Cancel</Link>
          <button onClick={() => save(false)} className="inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground">Update</button>
          {index + 1 < count && (
            <button onClick={() => save(true)} className="inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground">
              <span className="sm:hidden">Update &amp; next</span><span className="hidden sm:inline">Update &amp; next track</span>
            </button>
          )}
        </div>

        <div className="hidden gap-4 pt-4 sm:grid sm:grid-cols-2">
          <div>{index > 0 && <NeighbourCard track={data.tracks[index - 1]} label="Previous" position={index} isNext={false} href={trackHref(index - 1)} />}</div>
          <div>{index + 1 < count && <NeighbourCard track={data.tracks[index + 1]} label="Next" position={index + 2} isNext href={trackHref(index + 1)} />}</div>
        </div>
      </main>
    </div>
  );
}
