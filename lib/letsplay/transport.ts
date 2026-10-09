/**
 * Let's Play transport: volume steps and fade-out pause
 * (SpotifyRemoteRepository.fadeAndPausePlayer). With the djSports player
 * only its own volume fades (smooth, ~40 ms steps); otherwise the Spotify
 * device volume steps down through the Web API and is restored after.
 */
import { getVolume as apiGetVolume, pause as apiPause, setVolume as apiSetVolume } from "@/lib/spotify/dj-client";
import { adjustVolume as routedAdjust, isWebPlayerInUse, webFadeAndPause } from "@/lib/spotify/playback";
import { cancelWebFade } from "@/lib/spotify/web-player";

let fading: AbortController | null = null;

export const isFading = () => fading !== null;

/** Cancels a running fade (e.g. the user pressed play). */
export function abortFade(): void {
  fading?.abort();
  fading = null;
  cancelWebFade();
}

export const adjustVolume = routedAdjust;

export async function fadeAndPause(token: string, ms: number, onState?: (fading: boolean) => void): Promise<void> {
  abortFade();
  if (isWebPlayerInUse()) {
    onState?.(true);
    try { await webFadeAndPause(ms); } finally { onState?.(false); }
    return;
  }
  const start = await apiGetVolume(token);
  if (start == null || ms <= 0) { await apiPause(token); return; }
  const ctrl = new AbortController();
  fading = ctrl;
  onState?.(true);
  try {
    const steps = Math.max(4, Math.min(12, Math.round(ms / 150)));
    for (let i = 1; i <= steps; i++) {
      await new Promise(r => setTimeout(r, ms / steps));
      if (ctrl.signal.aborted) { await apiSetVolume(token, start); return; }
      await apiSetVolume(token, Math.round(start * (1 - i / steps)));
    }
    if (ctrl.signal.aborted) { await apiSetVolume(token, start); return; }
    await apiPause(token);
    await apiSetVolume(token, start);
  } finally {
    if (fading === ctrl) fading = null;
    onState?.(false);
  }
}
