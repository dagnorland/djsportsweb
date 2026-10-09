/**
 * djSports player — Spotify's Web Playback SDK running in this browser tab,
 * so the tab is its own Spotify Connect device "djSports". Same approach as
 * the Flutter macOS app (macos/Runner/SpotifyWebPlayer.swift): plays go to
 * this device with device_id + position_ms (start positions land exactly,
 * no Spotify app needed), pause / resume / volume go straight to the
 * player, and fade-pause lowers only the player volume.
 *
 * Framework-free singleton; React reads it with useWebPlayer().
 */

export const WEB_PLAYER_NAME = "djSports";

export interface WebPlaybackInfo {
  paused: boolean;
  positionMs: number;
  durationMs: number;
  uri: string | null;
  name: string | null;
  artists: string | null;
  album: string | null;
  imageUrl: string | null;
  /** Date.now() when positionMs was reported. */
  at: number;
}

export type WebPlayerStatus = "idle" | "loading" | "ready" | "error";

export interface WebPlayerState {
  status: WebPlayerStatus;
  deviceId: string | null;
  error: string | null;
  /** The djSports player is the active Spotify device. */
  active: boolean;
  playback: WebPlaybackInfo | null;
}

/* Minimal typings for the SDK. */
interface SpotifyPlayer {
  connect(): Promise<boolean>;
  disconnect(): void;
  addListener(event: string, cb: (arg: any) => void): void; // eslint-disable-line @typescript-eslint/no-explicit-any
  pause(): Promise<void>;
  resume(): Promise<void>;
  seek(ms: number): Promise<void>;
  setVolume(v: number): Promise<void>;
  getVolume(): Promise<number>;
  activateElement(): Promise<void>;
}
declare global {
  interface Window {
    Spotify?: { Player: new (o: { name: string; volume: number; getOAuthToken: (cb: (t: string) => void) => void }) => SpotifyPlayer };
    onSpotifyWebPlaybackSDKReady?: () => void;
  }
}

const SDK_URL = "https://sdk.scdn.co/spotify-player.js";

let player: SpotifyPlayer | null = null;
let starting = false;
let tokenProvider: (() => Promise<string | null>) | null = null;
let state: WebPlayerState = { status: "idle", deviceId: null, error: null, active: false, playback: null };
const listeners = new Set<(s: WebPlayerState) => void>();

/** Player volume 0–1 the user wants (fades go below it and come back). */
let userVolume = 1;
let currentVolume = 1;

function set(patch: Partial<WebPlayerState>) {
  state = { ...state, ...patch };
  listeners.forEach(l => l(state));
}

export const getWebPlayerState = () => state;

export function subscribeWebPlayer(l: (s: WebPlayerState) => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export const isWebPlayerReady = () => state.status === "ready" && !!state.deviceId && !!player;

function loadSdk(): Promise<void> {
  return new Promise(resolve => {
    if (window.Spotify?.Player) return resolve();
    const prev = window.onSpotifyWebPlaybackSDKReady;
    window.onSpotifyWebPlaybackSDKReady = () => { prev?.(); resolve(); };
    if (!document.querySelector(`script[src="${SDK_URL}"]`)) {
      const s = document.createElement("script");
      s.src = SDK_URL;
      s.async = true;
      document.body.appendChild(s);
    }
    // The layout may have loaded the SDK before we hooked in.
    const poll = setInterval(() => { if (window.Spotify?.Player) { clearInterval(poll); resolve(); } }, 250);
  });
}

/** Starts the player once (idempotent). `getToken` should return a fresh token. */
export async function startWebPlayer(getToken: () => Promise<string | null>): Promise<void> {
  tokenProvider = getToken;
  if (player || starting || typeof window === "undefined") return;
  starting = true;
  set({ status: "loading", error: null });
  try {
    await loadSdk();
    const p = new window.Spotify!.Player({
      name: WEB_PLAYER_NAME,
      volume: userVolume,
      // The SDK asks on connect and when its token is about to expire.
      getOAuthToken: cb => { tokenProvider?.().then(t => { if (t) cb(t); }); },
    });
    p.addListener("ready", ({ device_id }) => set({ status: "ready", deviceId: device_id, error: null }));
    p.addListener("not_ready", () => set({ deviceId: null, active: false, status: "loading" }));
    p.addListener("initialization_error", ({ message }) => set({ status: "error", error: `Browser not supported: ${message}` }));
    p.addListener("authentication_error", ({ message }) => set({ status: "error", error: `Spotify login problem: ${message}` }));
    p.addListener("account_error", ({ message }) => set({ status: "error", error: `The djSports player needs Spotify Premium (${message}).` }));
    p.addListener("playback_error", ({ message }) => set({ error: `Playback error: ${message}` }));
    p.addListener("autoplay_failed", () => set({ error: "The browser blocked autoplay — click play once in this tab." }));
    p.addListener("player_state_changed", s => {
      if (!s) { set({ active: false, playback: null }); return; }
      const track = s.track_window?.current_track;
      const album = track?.album ?? {};
      const image = [...(album.images ?? [])].sort((a: { width?: number }, b: { width?: number }) => (b.width ?? 0) - (a.width ?? 0))[0];
      set({
        active: true,
        playback: {
          paused: s.paused,
          positionMs: s.position,
          durationMs: s.duration,
          uri: track?.uri ?? null,
          name: track?.name ?? null,
          artists: track ? (track.artists ?? []).map((a: { name: string }) => a.name).join(", ") : null,
          album: album.name ?? null,
          imageUrl: image?.url ?? null,
          at: Date.now(),
        },
      });
    });
    player = p;
    const ok = await p.connect();
    if (!ok) set({ status: "error", error: "Web Playback SDK could not connect" });
  } catch (e) {
    set({ status: "error", error: e instanceof Error ? e.message : String(e) });
  } finally {
    starting = false;
  }
}

export function stopWebPlayer(): void {
  player?.disconnect();
  player = null;
  set({ status: "idle", deviceId: null, active: false, playback: null });
}

/**
 * Must run synchronously inside a click / key handler: browsers only let a
 * page start audio after a user gesture (Safari and Chrome autoplay rules).
 */
export function activateWebPlayer(): void {
  player?.activateElement().catch(() => {});
}

export async function webPause(): Promise<void> { await player?.pause(); }
export async function webResume(): Promise<void> { await restoreVolume(); await player?.resume(); }
export async function webSeek(ms: number): Promise<void> { await player?.seek(Math.round(ms)); }

async function applyVolume(v: number) {
  currentVolume = Math.min(1, Math.max(0, v));
  await player?.setVolume(currentVolume);
}

/** Back to the user's volume after a fade (before the next play / resume). */
export async function restoreVolume(): Promise<void> {
  if (currentVolume !== userVolume) await applyVolume(userVolume);
}

export const getWebVolumePercent = () => Math.round(userVolume * 100);

export async function setWebVolumePercent(pct: number): Promise<number> {
  userVolume = Math.min(1, Math.max(0, pct / 100));
  await applyVolume(userVolume);
  return Math.round(userVolume * 100);
}

let fadeTimer: ReturnType<typeof setInterval> | null = null;

export function cancelWebFade(): void {
  if (fadeTimer) { clearInterval(fadeTimer); fadeTimer = null; }
}

/** Fades only this player to silence (~40 ms steps), then pauses. */
export function webFadeAndPause(totalMs: number): Promise<void> {
  cancelWebFade();
  const steps = Math.max(1, Math.floor(totalMs / 40));
  const start = currentVolume;
  let step = 0;
  return new Promise(resolve => {
    fadeTimer = setInterval(async () => {
      step++;
      if (step < steps) { applyVolume(start * (1 - step / steps)); return; }
      cancelWebFade();
      try {
        await applyVolume(0);
        await player?.pause();
      } finally {
        resolve();
      }
    }, 40);
  });
}

/** Tests / previews only: fake a player state. */
export function debugSetWebPlayerState(patch: Partial<WebPlayerState>): void {
  set(patch);
}
