/**
 * Where playback goes — port of SpotifyRemoteRepository's macOS routing:
 * "This browser plays through"
 *   - webPlayer (default): the djSports player in this tab (Web Playback SDK)
 *   - webApi: follow the device chosen in Spotify (Web API only)
 * If the djSports player isn't ready or a play fails, it falls back to the
 * Web API on the active device.
 */
import {
  getPlaybackPosition, getVolume as apiGetVolume, pause as apiPause, playTrack,
  resume as apiResume, seek as apiSeek, setVolume as apiSetVolume,
} from "./dj-client";
import {
  activateWebPlayer, cancelWebFade, getWebPlayerState, getWebVolumePercent, isWebPlayerReady,
  restoreVolume, setWebVolumePercent, webFadeAndPause, webPause, webResume, webSeek,
} from "./web-player";

export type PlaybackMode = "webPlayer" | "webApi";
export const PLAYBACK_MODE_KEY = "spotifyMacPlayback"; // same key as Flutter

let mode: PlaybackMode = "webPlayer";
/** The last play went to the djSports player. */
let webInUse = false;

export const getPlaybackMode = () => mode;
export function setPlaybackModeCache(m: PlaybackMode): void { mode = m; if (m === "webApi") webInUse = false; }

const useWeb = () => mode === "webPlayer" && isWebPlayerReady();
/** Commands go to the djSports player when it is the one playing. */
const webActive = () => isWebPlayerReady() && (webInUse || getWebPlayerState().active);

/** Call synchronously in the click/key handler that starts playback. */
export function prepareUserGesture(): void {
  if (useWeb()) activateWebPlayer();
}

export async function play(token: string, uri: string, positionMs: number): Promise<"web" | "api"> {
  cancelWebFade();
  if (useWeb()) {
    try {
      await restoreVolume();
      await playTrack(token, uri, positionMs, getWebPlayerState().deviceId!);
      webInUse = true;
      return "web";
    } catch (e) {
      console.warn("[PLAY] djSports player failed, using Spotify device", e);
    }
  }
  webInUse = false;
  await playTrack(token, uri, positionMs);
  return "api";
}

export async function pause(token: string): Promise<void> {
  cancelWebFade();
  if (webActive()) { await webPause(); return; }
  await apiPause(token);
}

export async function resume(token: string): Promise<void> {
  cancelWebFade();
  if (webActive()) { await webResume(); return; }
  await apiResume(token);
}

export async function seek(token: string, ms: number): Promise<void> {
  if (webActive()) { await webSeek(ms); return; }
  await apiSeek(token, ms);
}

/** Volume 0–100: the djSports player's own volume, or the Spotify device volume. */
export async function getVolume(token: string): Promise<number | null> {
  if (useWeb()) return getWebVolumePercent();
  return apiGetVolume(token);
}

export async function adjustVolume(token: string, delta: number): Promise<number | null> {
  if (useWeb()) return setWebVolumePercent(getWebVolumePercent() + delta);
  const v = await apiGetVolume(token);
  if (v == null) return null;
  const next = Math.max(0, Math.min(100, v + delta));
  await apiSetVolume(token, next);
  return next;
}

export async function setVolume(token: string, pct: number): Promise<void> {
  if (useWeb()) { await setWebVolumePercent(pct); return; }
  await apiSetVolume(token, pct);
}

/** Current position: from the SDK when the djSports player plays, else the Web API. */
export async function getPosition(token: string): Promise<{ progressMs: number; isPlaying: boolean } | null> {
  const s = getWebPlayerState();
  if (webActive() && s.playback) {
    const p = s.playback;
    return { progressMs: p.paused ? p.positionMs : p.positionMs + (Date.now() - p.at), isPlaying: !p.paused };
  }
  const r = await getPlaybackPosition(token);
  return r && { progressMs: r.progressMs, isPlaying: r.isPlaying };
}

export const isWebPlayerInUse = () => webActive();
export { webFadeAndPause };
