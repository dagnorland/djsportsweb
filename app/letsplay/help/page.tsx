import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, CirclePause, Keyboard, MousePointerClick, Pause, SkipForward, Volume1, Volume2, X } from "lucide-react";

import { HelpCard as Card, HelpChip as Chip } from "@/components/stage/HelpCard";

export const metadata = { title: "Let's Play Help – djSports" };

/** Port of letsplay_help_screen.dart. */
export default function LetsPlayHelpPage() {
  return (
    <div className="dark min-h-screen bg-stage-bg text-stage-text">
      <header className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-2">
        <Link href="/letsplay" aria-label="Back" className="rounded-full p-2 hover:bg-stage-high"><ArrowLeft className="h-6 w-6" /></Link>
        <div>
          <h1 className="text-xl font-semibold">Let&apos;s Play Help</h1>
          <p className="text-xs text-stage-muted">Your live DJ control center during the event.</p>
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-3 px-4 pb-16">
        <Card icon={MousePointerClick} title="Start Playing a Playlist">
          <p>Click any playlist card to start playing the current track immediately on Spotify, from its start time.</p>
          <Chip>Click card → plays current track</Chip>
          <p>The card flashes briefly to confirm playback has started.</p>
        </Card>
        <Card icon={SkipForward} title="Auto Next Track">
          <p>If the playlist has &quot;Auto Next&quot; enabled, the card moves to the next track 2 seconds after it starts playing. At the end it starts over — or shuffles the playlist when &quot;Shuffle at end&quot; is on.</p>
          <Chip>Auto Next: set in playlist options</Chip>
        </Card>
        <Card icon={ChevronRight} title="Browse Tracks with ‹ and ›">
          <p>Each playlist card shows the current track. Use the arrow buttons (or swipe on a touch screen) to move through the tracks without playing them.</p>
          <p className="flex flex-wrap gap-2"><Chip><ChevronLeft className="h-3.5 w-3.5" /> Previous track</Chip><Chip><ChevronRight className="h-3.5 w-3.5" /> Next track</Chip></p>
          <p>Click the card after browsing to play the selected track.</p>
        </Card>
        <Card icon={Volume2} title="Volume and Pause">
          <p className="flex flex-wrap gap-2"><Chip><Volume2 className="h-3.5 w-3.5" /> Volume up (+5%)</Chip><Chip><Volume1 className="h-3.5 w-3.5" /> Volume down (−5%)</Chip></p>
          <p className="flex flex-wrap gap-2"><Chip><Pause className="h-3.5 w-3.5" /> Pause</Chip><Chip><CirclePause className="h-3.5 w-3.5 text-amber-300" /> Fade pause — when a fade time is set in Settings</Chip></p>
          <p>Volume is the Spotify device volume (Spotify Connect).</p>
        </Card>
        <Card icon={Keyboard} title="Keyboard shortcuts">
          <p>Turn on in Settings → Let&apos;s Play settings.</p>
          <p className="font-mono text-stage-text">Playlists: Hotspot 1–6 • Match Q–Y • Fun A–H</p>
          <p className="font-mono text-stage-text">Transport: P = play • Esc = pause • + = vol+ • − = vol−</p>
        </Card>
        <Card icon={X} title="Back to Home">
          <p>Click EXIT in the control bar to leave Let&apos;s Play. Music keeps playing in Spotify — pause first if you want it to stop.</p>
        </Card>
      </main>
    </div>
  );
}
