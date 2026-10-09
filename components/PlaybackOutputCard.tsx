"use client";

/** "This browser plays through" — port of the macOS choice in Spotify output (4.1.0). */
import { useSession } from "next-auth/react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDb } from "@/lib/db/djsports-db";
import { useLive } from "@/lib/db/useLive";
import { setSetting } from "@/lib/db/settings-repo";
import { useWebPlayer } from "@/lib/hooks/useWebPlayer";
import { PLAYBACK_MODE_KEY, type PlaybackMode } from "@/lib/spotify/playback";
import { activateWebPlayer, WEB_PLAYER_NAME } from "@/lib/spotify/web-player";
import { playErrorMessage, transferPlayback } from "@/lib/spotify/dj-client";
import { showAppToast } from "@/lib/ui/app-toast";

const OPTIONS: { value: PlaybackMode; title: string; help: string }[] = [
  {
    value: "webPlayer",
    title: "djSports player (recommended)",
    help: `This browser tab is its own Spotify Connect device "${WEB_PLAYER_NAME}". Start positions land exactly, no Spotify app needed, and fade-pause only lowers this player. Needs Spotify Premium; keep this tab open.`,
  },
  {
    value: "webApi",
    title: "Spotify device (follow Spotify)",
    help: "Plays on the device chosen in Spotify (phone, speaker, Spotify app) through the Web API. Volume is that device's volume.",
  },
];

export function PlaybackOutputCard() {
  const { data: session } = useSession();
  const web = useWebPlayer();
  const row = useLive(() => getDb().settings.get(PLAYBACK_MODE_KEY), []);
  const mode: PlaybackMode = row?.value === "webApi" ? "webApi" : "webPlayer";

  const transfer = async () => {
    if (!session?.accessToken || !web.deviceId) return;
    activateWebPlayer();
    try {
      await transferPlayback(session.accessToken, web.deviceId);
      showAppToast(`Spotify playback moved to ${WEB_PLAYER_NAME}`, { level: "warning" });
    } catch (e) {
      showAppToast("Could not move playback", { level: "error", description: playErrorMessage(e) });
    }
  };

  return (
    <div id="playback" className="space-y-3">
      <div className="space-y-2" role="radiogroup" aria-label="This browser plays through">
        {OPTIONS.map(o => (
          <label key={o.value} className={cn("flex cursor-pointer gap-3 rounded-lg border p-3", mode === o.value ? "border-ring" : "border-border")}>
            <input type="radio" name="playback" className="mt-1" checked={mode === o.value} onChange={() => setSetting(PLAYBACK_MODE_KEY, o.value)} />
            <span>
              <span className="block text-sm font-medium">{o.title}</span>
              <span className="block text-sm text-muted-foreground">{o.help}</span>
            </span>
          </label>
        ))}
      </div>
      {mode === "webPlayer" && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {web.status === "ready" ? <CheckCircle2 className="h-4 w-4 text-green-500" />
            : web.status === "error" ? <XCircle className="h-4 w-4 text-red-500" />
            : <Loader2 className="h-4 w-4 animate-spin" />}
          <span>
            {web.status === "ready" ? `Ready as "${WEB_PLAYER_NAME}"` : web.status === "error" ? "Not available" : session ? "Starting…" : "Log in to Spotify to start the player"}
            {web.active && " · playing here"}
          </span>
          {web.status === "ready" && !web.active && (
            <button onClick={transfer} className="rounded-full border border-border px-3 py-1 text-xs hover:bg-muted">Move Spotify playback here</button>
          )}
          {web.error && <p className="w-full text-sm text-red-500 select-text">{web.error}</p>}
          {web.status === "error" && <p className="w-full text-xs text-muted-foreground">Plays fall back to the active Spotify device.</p>}
        </div>
      )}
    </div>
  );
}
