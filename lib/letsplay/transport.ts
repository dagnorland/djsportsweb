/**
 * Let's Play transport on Spotify (Web API): volume steps, fade-out pause
 * (SpotifyRemoteRepository.fadeAndPausePlayer), play with last-played
 * bookkeeping.
 */
import { getVolume, pause, resume, setVolume } from "@/lib/spotify/dj-client";

let fading: AbortController | null = null;

export const isFading = () => fading !== null;

/** Cancels a running fade (e.g. the user pressed play). */
export function abortFade(): void {
  fading?.abort();
  fading = null;
}

/** Volume ±delta (percent points). Returns the new volume or null. */
export async function adjustVolume(token: string, delta: number): Promise<number | null> {
  const v = await getVolume(token);
  if (v == null) return null;
  const next = Math.max(0, Math.min(100, v + delta));
  await setVolume(token, next);
  return next;
}

/**
 * Lowers the volume to 0 over `ms`, pauses, then restores the volume so the
 * next track starts at the old level.
 */
export async function fadeAndPause(token: string, ms: number, onState?: (fading: boolean) => void): Promise<void> {
  abortFade();
  const start = await getVolume(token);
  if (start == null || ms <= 0) { await pause(token); return; }
  const ctrl = new AbortController();
  fading = ctrl;
  onState?.(true);
  try {
    const steps = Math.max(4, Math.min(12, Math.round(ms / 150)));
    for (let i = 1; i <= steps; i++) {
      await new Promise(r => setTimeout(r, ms / steps));
      if (ctrl.signal.aborted) { await setVolume(token, start); return; }
      await setVolume(token, Math.round(start * (1 - i / steps)));
    }
    if (ctrl.signal.aborted) { await setVolume(token, start); return; }
    await pause(token);
    await setVolume(token, start);
  } finally {
    if (fading === ctrl) fading = null;
    onState?.(false);
  }
}

export async function resumeAbortingFade(token: string): Promise<void> {
  abortFade();
  await resume(token);
}
