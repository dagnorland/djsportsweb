"use client";

/**
 * Now-playing panel for the djSports player — port of
 * djsports/lib/features/web_player/web_player_panel.dart. Sits below every
 * screen (Let's Play too) while the djSports player is the active Spotify
 * device. Drag the top edge to resize (cover and text grow with it), collapse
 * to a slim bar and back; height and visibility are saved
 * (settings: webPlayerPanelVisible, webPlayerPanelHeight).
 *
 * The panel publishes its height as the CSS variable --now-playing-h so
 * pages (and the full-screen Let's Play) can make room for it.
 */
/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Music, Pause, PauseCircle, PlayCircle } from "lucide-react";
import { useWebPlayer } from "@/lib/hooks/useWebPlayer";
import { getDb } from "@/lib/db/djsports-db";
import { useLive } from "@/lib/db/useLive";
import { SettingKeys, setSetting } from "@/lib/db/settings-repo";
import { webPause, webResume, webSeek, type WebPlaybackInfo } from "@/lib/spotify/web-player";

const MIN_H = 72;
const COLLAPSED_H = 30;
const HANDLE_H = 8;
const DEFAULT_H = 96;

const fmt = (ms: number) => {
  const t = Math.floor(Math.max(0, ms) / 1000);
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
};
const clampH = (h: number) => Math.min(Math.max(MIN_H, window.innerHeight * 0.7), Math.max(MIN_H, h));

/** Visible + height, shared with Let's Play (which hides its own now-playing). */
export function usePanelSettings() {
  const rows = useLive(() => getDb().settings.bulkGet([SettingKeys.webPlayerPanelVisible, SettingKeys.webPlayerPanelHeight]), []);
  const [v, h] = rows ?? [];
  return {
    visible: typeof v?.value === "boolean" ? v.value : true,
    height: typeof h?.value === "number" ? h.value : DEFAULT_H,
  };
}

export function WebPlayerPanel() {
  const { active, playback } = useWebPlayer();
  const saved = usePanelSettings();
  const [dragH, setDragH] = useState<number | null>(null);
  const showing = active && !!playback;
  const height = !showing ? 0 : saved.visible ? (typeof window === "undefined" ? saved.height : clampH(dragH ?? saved.height)) : COLLAPSED_H;

  useEffect(() => {
    document.documentElement.style.setProperty("--now-playing-h", `${height}px`);
    return () => { document.documentElement.style.setProperty("--now-playing-h", "0px"); };
  }, [height]);

  if (!showing || !playback) return null;

  return (
    <div
      className="dark fixed inset-x-0 bottom-0 z-[60] border-t border-stage-divider bg-stage-panel text-stage-text"
      style={{ height }}
    >
      {saved.visible ? (
        <div className="flex h-full flex-col">
          <ResizeHandle height={dragH ?? saved.height} onDrag={setDragH} onEnd={h => { setDragH(null); setSetting(SettingKeys.webPlayerPanelHeight, h); }} />
          <div className="min-h-0 flex-1"><NowPlaying state={playback} height={height - HANDLE_H} /></div>
        </div>
      ) : (
        <button
          className="flex h-full w-full items-center gap-2 px-3 text-left text-sm hover:bg-stage-high"
          onClick={() => setSetting(SettingKeys.webPlayerPanelVisible, true)}
          title="Show player"
        >
          {playback.paused ? <Pause className="h-4 w-4" /> : <Music className="h-4 w-4" />}
          <span className="min-w-0 flex-1 truncate">{[playback.name, playback.artists].filter(Boolean).join("  •  ")}</span>
          <ChevronUp className="h-[18px] w-[18px]" />
        </button>
      )}
    </div>
  );
}

/** Drag up/down to resize; the height is saved when the drag ends. */
function ResizeHandle({ height, onDrag, onEnd }: { height: number; onDrag: (h: number) => void; onEnd: (h: number) => void }) {
  const start = useRef<{ y: number; h: number } | null>(null);
  const last = useRef(height);
  const move = useCallback((e: PointerEvent) => {
    if (!start.current) return;
    last.current = clampH(start.current.h - (e.clientY - start.current.y));
    onDrag(last.current);
  }, [onDrag]);
  const up = useCallback(() => {
    if (!start.current) return;
    start.current = null;
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
    onEnd(last.current);
  }, [move, onEnd]);
  return (
    <div
      className="flex shrink-0 cursor-row-resize touch-none items-center justify-center"
      style={{ height: HANDLE_H }}
      onPointerDown={e => {
        start.current = { y: e.clientY, h: clampH(height) };
        last.current = start.current.h;
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
      }}
      title="Drag to resize"
    >
      <span className="h-[3px] w-10 rounded-sm bg-stage-muted" />
    </div>
  );
}

function NowPlaying({ state, height: h }: { state: WebPlaybackInfo; height: number }) {
  // Everything grows with the panel height.
  const compact = h < 110;
  const art = Math.min(280, Math.max(32, h - 12));
  const title = Math.min(30, Math.max(13, h / 7));
  const btn = Math.min(72, Math.max(28, h / 2.4));
  return (
    <div className="flex h-full items-center gap-3 pb-2 pl-3 pr-2">
      <span className="shrink-0 overflow-hidden rounded-md bg-stage-high" style={{ width: art, height: art }}>
        {state.imageUrl
          ? <img src={state.imageUrl} alt="" className="h-full w-full object-cover" />
          : <Music className="m-auto mt-[25%] h-1/2 w-1/2" />}
      </span>
      <div className="flex min-w-0 flex-1 flex-col justify-center overflow-hidden">
        <p className="truncate font-bold" style={{ fontSize: title }}>{state.name}</p>
        <p className="truncate" style={{ fontSize: title * 0.75 }}>{state.artists}</p>
        {!compact && state.album && <p className="truncate text-stage-muted" style={{ fontSize: title * 0.6 }}>{state.album}</p>}
        <div className="mt-1"><Progress state={state} compact={compact} /></div>
      </div>
      <button
        className="shrink-0 text-stage-text hover:opacity-80"
        onClick={() => (state.paused ? webResume() : webPause())}
        title={state.paused ? "Resume" : "Pause"}
        aria-label={state.paused ? "Resume" : "Pause"}
      >
        {state.paused
          ? <PlayCircle style={{ width: btn, height: btn }} fill="currentColor" className="[&>polygon]:fill-[hsl(var(--stage-panel))]" strokeWidth={1.5} />
          : <PauseCircle style={{ width: btn, height: btn }} fill="currentColor" className="[&>line]:stroke-[hsl(var(--stage-panel))]" strokeWidth={1.5} />}
      </button>
      <button className="shrink-0 rounded-full p-2 hover:bg-stage-high" onClick={() => setSetting(SettingKeys.webPlayerPanelVisible, false)} title="Hide player" aria-label="Hide player">
        <ChevronDown className="h-5 w-5" />
      </button>
    </div>
  );
}

/** Ticks locally while playing (the SDK reports only on changes); a seek slider in the larger layout. */
function Progress({ state, compact }: { state: WebPlaybackInfo; compact: boolean }) {
  const [, tick] = useState(0);
  const [drag, setDrag] = useState<number | null>(null);
  useEffect(() => {
    if (state.paused) return;
    const t = setInterval(() => tick(n => n + 1), 250);
    return () => clearInterval(t);
  }, [state.paused]);
  const duration = state.durationMs;
  const position = drag ?? Math.min(duration, state.paused ? state.positionMs : state.positionMs + (Date.now() - state.at));
  const times = (
    <div className="flex text-[11px] tabular-nums"><span>{fmt(position)}</span><span className="ml-auto">{fmt(duration)}</span></div>
  );
  if (compact || duration <= 0) {
    return (
      <div>
        <div className="h-[3px] w-full overflow-hidden rounded bg-stage-text/25">
          <div className="h-full bg-stage-text" style={{ width: `${duration > 0 ? Math.min(100, (position / duration) * 100) : 0}%` }} />
        </div>
        <div className="mt-0.5">{times}</div>
      </div>
    );
  }
  const commit = (v: number) => { webSeek(v).finally(() => setDrag(null)); };
  return (
    <div>
      <input
        type="range" min={0} max={duration} step={250} value={position}
        onChange={e => setDrag(Number(e.target.value))}
        onPointerUp={e => commit(Number(e.currentTarget.value))}
        onKeyUp={e => commit(Number(e.currentTarget.value))}
        className="h-6 w-full cursor-pointer accent-[hsl(var(--stage-text))]"
        aria-label="Position"
      />
      {times}
    </div>
  );
}
