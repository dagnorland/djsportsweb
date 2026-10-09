"use client";

/**
 * Let's Play — port of djsports/lib/features/djletsplay/djletsplay.dart.
 * Always dark. Board: one section per type (Hotspot, Match, Fun Stuff,
 * Pre-Match), every section with as many columns as the largest one.
 * Controls: sidebar left/right or bottom bar on wide screens, compact bar
 * on phones. Keyboard (when enabled): Hotspot 1–6, Match Q–Y, Fun A–H,
 * P = play, Esc = pause, +/− = volume.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDb } from "@/lib/db/djsports-db";
import { useLive } from "@/lib/db/useLive";
import { SettingKeys, setSetting } from "@/lib/db/settings-repo";
import { shufflePlaylist } from "@/lib/db/playlist-actions";
import { typeBg, typeLabel, typeText } from "@/lib/theme/playlistTypes";
import { useDJPlayer } from "@/lib/hooks/useDJPlayer";
import { getVolume } from "@/lib/spotify/dj-client";
import { abortFade, adjustVolume, fadeAndPause } from "@/lib/letsplay/transport";
import { useLetsPlaySettings } from "@/lib/letsplay/settings";
import { showAppToast } from "@/lib/ui/app-toast";
import { formatDuration } from "@/lib/utils/formatTime";
import { startPositionMs, type DJPlaylist, type DJPlaylistType, type DJTrack } from "@/lib/types/djmodels";
import { LetsPlayCard, type LetsPlayCardHandle } from "./LetsPlayCard";
import { LetsPlayCompactBar, LetsPlaySidebar, type ControlsProps } from "./LetsPlayControls";

const SECTIONS: DJPlaylistType[] = ["hotspot", "match", "funStuff", "preMatch"];
const KEYS: Partial<Record<DJPlaylistType, string[]>> = {
  hotspot: ["1", "2", "3", "4", "5", "6"],
  match: ["q", "w", "e", "r", "t", "y"],
  funStuff: ["a", "s", "d", "f", "g", "h"],
};
const BOTTOM_BAR = 104;
const MIN_BOARD = 480;
const sectionLabel = (t: DJPlaylistType) => (t === "preMatch" ? "Pre-Match" : t === "funStuff" ? "Fun Stuff" : typeLabel(t));

function useViewport() {
  const [size, setSize] = useState({ w: 1200, h: 800 });
  useLayoutEffect(() => {
    const on = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return size;
}

export function LetsPlayView() {
  const router = useRouter();
  const player = useDJPlayer();
  const settings = useLetsPlaySettings();
  const { w, h } = useViewport();

  const data = useLive(async () => {
    const [playlists, tracks] = await Promise.all([getDb().djplaylist.toArray(), getDb().djtrack.toArray()]);
    return { playlists, tracksById: new Map(tracks.map(t => [t.id, t])) };
  }, []);
  const lastPlayedId = useLive(async () => (await getDb().settings.get(SettingKeys.lastDjTrackPlayed))?.value as string | undefined, []);

  const [volume, setVol] = useState<number | null>(null);
  const [fading, setFading] = useState(false);
  const cards = useRef(new Map<string, LetsPlayCardHandle>());

  const sections = useMemo(() => {
    if (!data) return [];
    return SECTIONS.map(type => ({
      type,
      playlists: data.playlists
        .filter(p => p.type === type)
        .sort((a, b) => a.position - b.position)
        .map(p => ({ p, tracks: p.trackIds.map(id => data.tracksById.get(id)).filter((t): t is DJTrack => !!t) }))
        .filter(x => x.tracks.length > 0),
    })).filter(s => s.playlists.length > 0);
  }, [data]);
  const maxPerSection = Math.max(1, ...sections.map(s => s.playlists.length));
  const lastTrack = (lastPlayedId && data?.tracksById.get(lastPlayedId)) || null;

  // Volume on open (Flutter shows it as a toast).
  useEffect(() => {
    if (!player.token) return;
    getVolume(player.token).then(v => {
      setVol(v);
      if (v != null) showAppToast(`Volume: ${v}%`);
    }).catch(() => {});
  }, [player.token]);

  const onPlay = useCallback(async (playlist: DJPlaylist, track: DJTrack) => {
    abortFade();
    const ok = await player.play(track);
    if (!ok) return false;
    const db = getDb();
    await db.djtrack.update(track.id, { playCount: (track.playCount ?? 0) + 1 });
    await db.djplaylist.update(playlist.id, { playCount: (playlist.playCount ?? 0) + 1 });
    await setSetting(SettingKeys.lastDjTrackPlayed, track.id);
    const start = startPositionMs(track);
    showAppToast(`${track.name} – ${track.artist}`, { description: start > 0 ? `Start @ ${formatDuration(start)}` : undefined });
    return true;
  }, [player]);

  const resume = useCallback(() => { abortFade(); player.resume(); }, [player]);
  const pause = useCallback(async () => { abortFade(); if (await player.pause()) showAppToast("PAUSED", { durationMs: 2000 }); }, [player]);
  const fadePause = useCallback(async () => {
    if (!player.token) return;
    try {
      await fadeAndPause(player.token, settings.fadeVolumeMs, setFading);
      showAppToast(`FADED (${settings.fadeVolumeMs} ms)`, { durationMs: 2000 });
    } catch (e) {
      showAppToast("Fade failed", { level: "error", description: String(e) });
    }
  }, [player.token, settings.fadeVolumeMs]);
  const changeVolume = useCallback(async (d: number) => {
    if (!player.token) return;
    try { setVol(await adjustVolume(player.token, d)); } catch { /* ignore */ }
  }, [player.token]);
  const exit = useCallback(() => router.push("/home"), [router]);

  // Keyboard shortcuts.
  useEffect(() => {
    if (!settings.keyboardShortcutsEnabled) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      const handled = () => { e.preventDefault(); };
      if (e.repeat) { if (k.length === 1 || k === "escape") handled(); return; }
      if (k === "escape") { handled(); pause(); return; }
      if (k === "p") { handled(); resume(); return; }
      if (k === "+" || k === "=") { handled(); changeVolume(5); return; }
      if (k === "-") { handled(); changeVolume(-5); return; }
      for (const s of sections) {
        const i = KEYS[s.type]?.indexOf(k) ?? -1;
        if (i >= 0) {
          handled();
          const target = s.playlists[i];
          if (target) cards.current.get(target.p.id)?.play();
          return;
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [settings.keyboardShortcutsEnabled, sections, pause, resume, changeVolume]);

  const controls: ControlsProps = {
    lastTrack, volume, fadeMs: settings.fadeVolumeMs, fading,
    onPlay: resume, onPause: pause, onFadePause: fadePause, onVolume: changeVolume, onExit: exit,
  };

  const wide = w >= 600 && h >= 500;
  let position = settings.sidebarPosition;
  if (position === "bottom" && h - BOTTOM_BAR < MIN_BOARD) position = "right";
  const cardH = Math.min(260, Math.max(90, h * 0.18));

  const board = (
    <div className="h-full overflow-y-auto">
      {!data ? (
        <div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : sections.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-stage-muted">
          <p>No playlists with tracks yet.</p>
          <button className="rounded-full bg-stage-text px-4 py-2 text-sm font-semibold text-stage-bg" onClick={exit}>Back to home</button>
        </div>
      ) : sections.map(s => (
        <Section key={s.type} type={s.type} width={wide && position !== "bottom" ? w * 0.85 : w} maxPerSection={maxPerSection}>
          {s.playlists.map(({ p, tracks }, i) => (
            <LetsPlayCard
              key={p.id}
              ref={el => { if (el) cards.current.set(p.id, el); else cards.current.delete(p.id); }}
              playlist={p}
              tracks={tracks}
              height={cardH}
              shortcutKey={settings.keyboardShortcutsEnabled ? KEYS[s.type]?.[i] : undefined}
              onPlay={track => onPlay(p, track)}
              onIndexChange={idx => { getDb().djplaylist.update(p.id, { currentTrack: idx }).catch(() => {}); }}
              onWrap={msg => showAppToast(msg)}
              onShuffleAtEnd={() => { shufflePlaylist(p.id).catch(() => {}); }}
            />
          ))}
        </Section>
      ))}
    </div>
  );

  return (
    <div className="dark fixed inset-0 z-50 bg-stage-bg text-stage-text">
      {wide ? (
        position === "bottom" ? (
          <div className="flex h-full flex-col">
            <div className="min-h-0 flex-1">{board}</div>
            <div className="border-t border-stage-divider" style={{ height: BOTTOM_BAR }}><LetsPlaySidebar axis="horizontal" {...controls} /></div>
          </div>
        ) : (
          <div className={cn("flex h-full", position === "left" && "flex-row-reverse")}>
            <div className="min-w-0 flex-[85]">{board}</div>
            <div className={cn("min-w-[120px] flex-[15]", position === "left" ? "border-r" : "border-l", "border-stage-divider")}>
              <LetsPlaySidebar axis="vertical" {...controls} />
            </div>
          </div>
        )
      ) : (
        <div className="flex h-full flex-col pt-[env(safe-area-inset-top)]">
          <div className="min-h-0 flex-1">{board}</div>
          <div className="border-t border-stage-divider"><LetsPlayCompactBar {...controls} /></div>
        </div>
      )}
    </div>
  );
}

function Section({ type, width, maxPerSection, children }: { type: DJPlaylistType; width: number; maxPerSection: number; children: React.ReactNode }) {
  const fit = Math.max(1, Math.floor(width / 180));
  const cols = Math.min(Math.max(1, maxPerSection), fit);
  return (
    <section>
      <div className="flex items-center gap-2 px-2 pb-0.5 pt-2">
        <span className={cn("h-[18px] w-1.5", typeBg(type))} />
        <h2 className={cn("text-xs font-black uppercase tracking-[0.1em]", typeText(type))}>{sectionLabel(type)}</h2>
      </div>
      <div className="grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>{children}</div>
      <div className={cn("mt-0.5 h-[3px]", typeBg(type))} />
    </section>
  );
}
