"use client";

/**
 * Now-playing panel for the djSports player (web_player_panel.dart, slim
 * version): cover, title, artist, position slider (seek), play / pause.
 * Shown at the bottom while the djSports player is the active device.
 */
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { Music, Pause, Play } from "lucide-react";
import { useWebPlayer } from "@/lib/hooks/useWebPlayer";
import { webPause, webResume, webSeek } from "@/lib/spotify/web-player";
import { formatDuration } from "@/lib/utils/formatTime";

export function WebNowPlayingPanel() {
  const { active, playback } = useWebPlayer();
  const [now, setNow] = useState(() => Date.now());
  const [drag, setDrag] = useState<number | null>(null);

  useEffect(() => {
    if (!playback || playback.paused) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [playback]);

  if (!active || !playback) return null;
  const pos = Math.min(playback.durationMs, playback.paused ? playback.positionMs : playback.positionMs + (now - playback.at));
  const shown = drag ?? pos;

  return (
    <div className="dark fixed inset-x-0 bottom-0 z-40 border-t border-stage-divider bg-stage-panel text-stage-text">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-3 py-2">
        <span className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-stage-high">
          {playback.imageUrl ? <img src={playback.imageUrl} alt="" className="h-full w-full object-cover" /> : <Music className="m-3 h-6 w-6 text-stage-text/30" />}
        </span>
        <div className="min-w-0 w-48 shrink-0 sm:w-64">
          <p className="truncate text-sm font-bold">{playback.name}</p>
          <p className="truncate text-xs text-stage-muted">{playback.artists}{playback.album ? ` · ${playback.album}` : ""}</p>
        </div>
        <button
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stage-text text-stage-bg"
          onClick={() => (playback.paused ? webResume() : webPause())}
          aria-label={playback.paused ? "Play" : "Pause"}
        >
          {playback.paused ? <Play className="h-5 w-5" fill="currentColor" /> : <Pause className="h-5 w-5" fill="currentColor" />}
        </button>
        <span className="hidden w-11 text-right text-xs tabular-nums text-stage-muted sm:block">{formatDuration(shown)}</span>
        <input
          type="range" min={0} max={playback.durationMs || 1} step={250} value={shown}
          onChange={e => setDrag(Number(e.target.value))}
          onMouseUp={e => { webSeek(Number(e.currentTarget.value)); setDrag(null); }}
          onTouchEnd={e => { webSeek(Number(e.currentTarget.value)); setDrag(null); }}
          className="hidden min-w-0 flex-1 accent-[hsl(var(--stage-text))] sm:block"
          aria-label="Position"
        />
        <span className="hidden w-11 text-xs tabular-nums text-stage-muted sm:block">{formatDuration(playback.durationMs)}</span>
        <span className="ml-auto shrink-0 rounded-full bg-[#1DB954]/15 px-2 py-0.5 text-[10px] font-bold text-[#1DB954]">djSports player</span>
      </div>
    </div>
  );
}
