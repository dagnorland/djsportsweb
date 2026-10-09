"use client";

/**
 * Let's Play controls — CenterControlWidget (sidebar / bottom bar) and the
 * compact phone bar: play, pause, fade pause, volume ±, now playing, help,
 * logo with version, and the always-visible EXIT.
 */
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { CircleHelp, CirclePause, ExternalLink, Music, Pause, Play, Volume1, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExitButton } from "@/components/stage/ExitButton";
import { FlashingLogo } from "@/components/stage/FlashingLogo";
import packageJson from "@/package.json";
import type { DJTrack } from "@/lib/types/djmodels";

export interface ControlsProps {
  lastTrack: DJTrack | null;
  volume: number | null;
  fadeMs: number;
  fading: boolean;
  onPlay: () => void;
  onPause: () => void;
  onFadePause: () => void;
  onVolume: (delta: number) => void;
  onExit: () => void;
}

const btn = "inline-flex items-center justify-center rounded-full text-stage-text hover:bg-stage-high active:scale-95 disabled:opacity-40";

function NowPlaying({ track, horizontal }: { track: DJTrack | null; horizontal?: boolean }) {
  if (!track) return null;
  return (
    <div className={cn("flex items-center gap-1.5", horizontal ? "flex-row" : "flex-col")}>
      <span key={track.id} className="block h-[70px] w-[70px] shrink-0 animate-in fade-in zoom-in-90 overflow-hidden rounded-xl bg-stage-high">
        {track.networkImageUri ? <img src={track.networkImageUri} alt="" className="h-full w-full object-cover" /> : <Music className="m-auto mt-5 h-8 w-8 text-stage-text/25" />}
      </span>
      <span className={cn("w-20", horizontal ? "text-left" : "text-center")}>
        <span className="line-clamp-2 text-[11px] font-bold">{track.name}</span>
        {track.artist && <span className="block truncate text-[10px] text-stage-text/70">{track.artist}</span>}
      </span>
    </div>
  );
}

/** Sidebar (vertical) or bottom bar (horizontal) on wide screens. */
export function LetsPlaySidebar({ axis, ...p }: ControlsProps & { axis: "vertical" | "horizontal" }) {
  const v = axis === "vertical";
  return (
    <div className={cn("flex h-full w-full", v ? "flex-col" : "flex-row items-center")}>
      <div className={cn("flex flex-1 items-center gap-3", v ? "flex-col overflow-y-auto py-2" : "flex-row overflow-x-auto px-2")}>
        <button className={cn(btn, "h-12 w-12")} onClick={p.onPlay} aria-label="Play"><Play className="h-9 w-9" fill="currentColor" /></button>
        <a className={cn(btn, "h-11 w-11 text-[#1DB954]")} href="https://open.spotify.com" target="_blank" rel="noreferrer" title="Open Spotify"><ExternalLink className="h-7 w-7" /></a>
        <div className={cn("flex items-center", v ? "flex-col" : "flex-row")}>
          <button className={cn(btn, "h-[84px] w-[84px]")} onClick={p.onPause} aria-label="Pause"><Pause className="h-[70px] w-[70px]" fill="currentColor" strokeWidth={0} /></button>
          {p.fadeMs > 0 && (
            <button className={cn(btn, "h-14 w-14 flex-col text-amber-300", p.fading && "text-amber-500")} onClick={p.onFadePause} disabled={p.fading} title={p.fading ? "Fading…" : `Fade pause (${p.fadeMs} ms)`}>
              <CirclePause className="h-9 w-9" />
              <span className="text-[9px] font-bold">{p.fading ? "FADING" : "FADE"}</span>
            </button>
          )}
        </div>
        <button className={cn(btn, "h-14 w-14")} onClick={() => p.onVolume(5)} aria-label="Volume up"><Volume2 className="h-11 w-11" /></button>
        <span className="text-sm font-bold tabular-nums">{p.volume != null ? `${p.volume}%` : "–"}</span>
        <button className={cn(btn, "h-14 w-14")} onClick={() => p.onVolume(-5)} aria-label="Volume down"><Volume1 className="h-11 w-11" /></button>
        <NowPlaying track={p.lastTrack} horizontal={!v} />
        <FlashingLogo size={56} version={`v${packageJson.version}`} versionClassName="text-stage-text/70" />
        <Link href="/letsplay/help" className={cn(btn, "h-10 w-10 text-stage-text/60")} title="Help"><CircleHelp className="h-[22px] w-[22px]" /></Link>
      </div>
      <div className={cn("flex shrink-0 justify-center p-2", !v && "items-center")}><ExitButton onClick={p.onExit} /></div>
    </div>
  );
}

/** Phone bar: last track line + one row of buttons. */
export function LetsPlayCompactBar(p: ControlsProps) {
  return (
    <div className="pb-[env(safe-area-inset-bottom)]">
      {p.lastTrack && (
        <p className="flex items-center gap-1 truncate px-3 pt-1 text-xs font-semibold">
          <Music className="h-[13px] w-[13px] shrink-0 text-stage-text/60" />
          {p.lastTrack.artist ? `${p.lastTrack.name}  •  ${p.lastTrack.artist}` : p.lastTrack.name}
        </p>
      )}
      <div className="flex h-16 items-center justify-evenly">
        <button className={cn(btn, "h-10 w-10")} onClick={p.onPlay} aria-label="Play"><Play className="h-8 w-8" fill="currentColor" /></button>
        <button className={cn(btn, "h-10 w-10")} onClick={p.onPause} aria-label="Pause"><Pause className="h-8 w-8" fill="currentColor" strokeWidth={0} /></button>
        {p.fadeMs > 0 && (
          <button className={cn(btn, "h-10 w-10 text-amber-300")} onClick={p.onFadePause} disabled={p.fading} aria-label="Fade pause"><CirclePause className="h-8 w-8" /></button>
        )}
        <button className={cn(btn, "h-10 w-10")} onClick={() => p.onVolume(5)} aria-label="Volume up"><Volume2 className="h-7 w-7" /></button>
        <button className={cn(btn, "h-10 w-10")} onClick={() => p.onVolume(-5)} aria-label="Volume down"><Volume1 className="h-7 w-7" /></button>
        <Link href="/letsplay/help" className={cn(btn, "h-10 w-10 text-stage-text/60")} aria-label="Help"><CircleHelp className="h-6 w-6" /></Link>
        <ExitButton compact onClick={p.onExit} />
      </div>
    </div>
  );
}
