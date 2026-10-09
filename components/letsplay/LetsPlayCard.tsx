"use client";

/**
 * One playlist tile in Let's Play — port of letsplay_playlist_card.dart:
 * type-coloured left border, cover as a faint background, header with
 * shortcut key, name, ‹ #n/m ›; cover with round play button, title (never
 * broken mid-word), artist, start time. Click plays the current track at
 * its start position and flashes the tile; Auto Next moves on after 2 s;
 * swipe to change track on touch screens.
 */
/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, forwardRef } from "react";
import { ChevronLeft, ChevronRight, ListMusic, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { typeBg, typeBorder, typeText } from "@/lib/theme/playlistTypes";
import { formatDuration } from "@/lib/utils/formatTime";
import { startPositionMs, type DJPlaylist, type DJTrack } from "@/lib/types/djmodels";

export interface LetsPlayCardHandle { play: () => void }

let measureCtx: CanvasRenderingContext2D | null = null;
/** Width of the widest word of `text` in bold at `size` px. */
function widestWord(text: string, size: number): number {
  if (typeof document === "undefined") return 0;
  measureCtx ??= document.createElement("canvas").getContext("2d");
  if (!measureCtx) return 0;
  const family = getComputedStyle(document.body).fontFamily || "sans-serif";
  measureCtx.font = `700 ${size}px ${family}`;
  return Math.max(0, ...text.split(/\s+/).map(w => measureCtx!.measureText(w).width));
}

/**
 * `_TrackTitle`: never break inside a word. If the widest word doesn't fit,
 * shrink the font (down to 80 %) or fall back to one line with "…".
 */
function fitTitle(text: string, size: number, maxWidth: number, maxLines: number): { size: number; lines: number } {
  if (maxLines === 1 || maxWidth <= 0) return { size, lines: 1 };
  const w = widestWord(text, size);
  if (w <= maxWidth) return { size, lines: maxLines };
  const scale = maxWidth / w;
  if (scale < 0.8) return { size, lines: 1 };
  return { size: Math.floor(size * scale), lines: maxLines };
}

export const LetsPlayCard = forwardRef<LetsPlayCardHandle, {
  playlist: DJPlaylist;
  tracks: DJTrack[];
  height: number;
  shortcutKey?: string;
  onPlay: (track: DJTrack) => Promise<boolean>;
  onIndexChange: (index: number) => void;
  onWrap: (message: string) => void;
  onShuffleAtEnd: () => void;
}>(function LetsPlayCard({ playlist, tracks, height, shortcutKey, onPlay, onIndexChange, onWrap, onShuffleAtEnd }, ref) {
  const [index, setIndex] = useState(() => Math.min(Math.max(0, playlist.currentTrack), Math.max(0, tracks.length - 1)));
  const [dir, setDir] = useState<1 | -1>(1);
  const [flash, setFlash] = useState(0);
  const autoNext = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const root = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(300);

  useLayoutEffect(() => {
    if (!root.current) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(root.current);
    return () => ro.disconnect();
  }, []);
  useEffect(() => () => clearTimeout(autoNext.current), []);

  const total = tracks.length;
  const idx = Math.min(index, Math.max(0, total - 1));
  const track = tracks[idx];

  const go = useCallback((to: number, d: 1 | -1) => {
    clearTimeout(autoNext.current);
    setDir(d);
    setIndex(to);
    onIndexChange(to);
  }, [onIndexChange]);

  const prev = () => (idx > 0 ? go(idx - 1, -1) : (go(total - 1, -1), onWrap("↩ Last track")));
  const next = () => (idx < total - 1 ? go(idx + 1, 1) : (go(0, 1), onWrap("↩ Back to start")));

  const play = useCallback(async () => {
    if (!track) return;
    clearTimeout(autoNext.current);
    setFlash(f => f + 1);
    const ok = await onPlay(track);
    if (ok && playlist.autoNext) {
      const at = idx;
      autoNext.current = setTimeout(() => {
        if (at < total - 1) go(at + 1, 1);
        else if (playlist.shuffleAtEnd) { onShuffleAtEnd(); go(0, 1); onWrap("🔀 Playlist shuffled"); }
        else { go(0, 1); onWrap("↩ Back to start"); }
      }, 2000);
    }
  }, [track, idx, total, playlist.autoNext, playlist.shuffleAtEnd, onPlay, go, onWrap, onShuffleAtEnd]);

  useImperativeHandle(ref, () => ({ play }), [play]);

  // Swipe left/right to change track.
  const touch = useRef<{ x: number; t: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { touch.current = { x: e.touches[0].clientX, t: Date.now() }; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const s = touch.current; touch.current = null;
    if (!s) return;
    const dx = e.changedTouches[0].clientX - s.x;
    const v = dx / Math.max(1, Date.now() - s.t) * 1000;
    if (Math.abs(dx) > 40 && Math.abs(v) > 200) { e.preventDefault(); (dx < 0 ? next : prev)(); }
  };

  if (!track) return null;

  const inner = height - 34; // header + paddings
  const titleSize = Math.min(20, Math.max(13, inner / 5));
  const cover = Math.min(160, Math.max(36, Math.min(inner, width * 0.4)));
  const button = Math.min(52, Math.max(24, cover * 0.38));
  const startMs = startPositionMs(track);
  const showArrows = width >= 260;
  const title = fitTitle(track.name, titleSize, width - 5 - 12 - cover - 10, inner >= 80 ? 2 : 1);
  const type = playlist.type;

  return (
    <div
      ref={root}
      role="button"
      tabIndex={0}
      onClick={play}
      onKeyDown={e => { if (e.key === "Enter") play(); }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className={cn("relative m-1 cursor-pointer select-none overflow-hidden rounded-md border-l-[5px] bg-stage-surface shadow", typeBorder(type))}
      style={{ height }}
      aria-label={`Play ${track.name} from ${playlist.name}`}
    >
      {track.networkImageUri && (
        <img src={track.networkImageUri} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20" />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-stage-surface/90 to-stage-surface/50" />
      {flash > 0 && <div key={flash} className={cn("pointer-events-none absolute inset-0 animate-tile-flash", typeBg(type))} />}

      <div className="relative flex h-full flex-col px-1.5 pb-1.5 pt-1">
        <div className="flex items-center gap-1">
          {shortcutKey && (
            <span className={cn("flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[5px] text-xs font-black text-white", typeBg(type))}>
              {shortcutKey.toUpperCase()}
            </span>
          )}
          <span className="min-w-0 flex-1 truncate text-sm font-black uppercase">{playlist.name}</span>
          {showArrows && (
            <button onClick={e => { e.stopPropagation(); prev(); }} className="rounded hover:bg-stage-high" aria-label="Previous track"><ChevronLeft className="h-5 w-5" /></button>
          )}
          <span className={cn("text-[11px] font-semibold tabular-nums", typeText(type))}>#{idx + 1}/{total}</span>
          {showArrows && (
            <button onClick={e => { e.stopPropagation(); next(); }} className="rounded hover:bg-stage-high" aria-label="Next track"><ChevronRight className="h-5 w-5" /></button>
          )}
        </div>

        <div className="relative mt-1 min-h-0 flex-1 overflow-hidden">
          <div key={`${idx}`} className={cn("flex h-full items-center gap-2.5", dir > 0 ? "animate-slide-in-right" : "animate-slide-in-left")}>
            <div className="relative shrink-0" style={{ width: cover, height: cover }}>
              {track.networkImageUri
                ? <img src={track.networkImageUri} alt="" className="h-full w-full rounded object-cover" />
                : <div className="flex h-full w-full items-center justify-center rounded bg-stage-high"><ListMusic className="h-1/2 w-1/2 text-stage-text/25" /></div>}
              <span
                className={cn("absolute bottom-1 right-1 flex items-center justify-center rounded-full text-white shadow-lg shadow-black/50", typeBg(type))}
                style={{ width: button, height: button }}
              >
                <Play style={{ width: button * 0.6, height: button * 0.6 }} fill="currentColor" strokeWidth={0} />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p
                className={cn("font-bold leading-[1.15]", title.lines > 1 ? "line-clamp-2 [overflow-wrap:normal]" : "truncate")}
                style={{ fontSize: title.size }}
                title={track.name}
              >
                {track.name}
              </p>
              <p className="mt-0.5 truncate text-stage-muted" style={{ fontSize: titleSize * 0.8 }}>{track.artist}</p>
              {startMs > 0 && (
                <p className={cn("font-extrabold", typeText(type))} style={{ fontSize: titleSize * 0.75 }}>Start {formatDuration(startMs)}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
