import Link from "next/link";
import { ArrowLeft, ListPlus, Plus, RefreshCw, Tag, Timer, Link2 } from "lucide-react";
import { HelpCard, HelpChip } from "@/components/stage/HelpCard";
import { TypeBadge } from "@/components/stage/TypeBadge";

export const metadata = { title: "Playlist Help – djSports" };

/** Port of djsports/lib/features/djsports/playlist_help_screen.dart. */
export default function PlaylistHelpPage() {
  return (
    <div className="min-h-screen bg-stage-bg text-stage-text">
      <header className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-2">
        <Link href="/home" aria-label="Back" className="rounded-full p-2 hover:bg-stage-high"><ArrowLeft className="h-6 w-6" /></Link>
        <div>
          <h1 className="text-xl font-semibold">Playlist Help</h1>
          <p className="text-xs text-stage-muted">Set up your playlists with Spotify tracks for the event.</p>
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-3 px-4 pb-16">
        <HelpCard icon={ListPlus} title="Add a New Playlist">
          <p>Click the + button in the top bar of the home screen to create a new playlist.</p>
          <HelpChip><Plus className="h-3.5 w-3.5" /> New Playlist</HelpChip>
          <p>Give the playlist a name that makes it easy to identify during the event.</p>
        </HelpCard>
        <HelpCard icon={Tag} title="Set the Playlist Type">
          <p>Choose the type that fits when this playlist will be played:</p>
          <div className="space-y-2">
            <TypeBadge type="hotspot" description="— goals, slam dunks and direct scoring moments" />
            <TypeBadge type="match" description="— penalties, floor cleaning, time-outs" />
            <TypeBadge type="funStuff" description="— get the crowd to cheer, clap and make noise" />
            <TypeBadge type="preMatch" description="— warm-up and player introductions" />
          </div>
          <p>The order within a type (drag the cards on the home screen) is the order in Let&apos;s Play.</p>
        </HelpCard>
        <HelpCard icon={Link2} title="Paste the Spotify URI">
          <p>Open Spotify and find the playlist you want to use. Copy its link:</p>
          <p>In Spotify: ··· on a playlist → Share → Copy link to playlist (or Copy Spotify URI).</p>
          <p>Paste it into the Spotify URI field in the playlist editor (Show details).</p>
          <HelpChip>Spotify URI field</HelpChip>
        </HelpCard>
        <HelpCard icon={RefreshCw} title="Sync Tracks from Spotify">
          <p>After pasting the link, click the Sync button to import all tracks from that Spotify playlist.</p>
          <HelpChip><RefreshCw className="h-3.5 w-3.5" /> Sync</HelpChip>
          <p>The app fetches the tracks and adds them to your playlist. This requires a Spotify connection.</p>
          <p>You can re-sync later to pick up new tracks added to the Spotify playlist — the editor also offers them when you open it.</p>
        </HelpCard>
        <HelpCard icon={Timer} title="Edit Track Start Times">
          <p>Each track can have a custom start time so playback begins at the best moment of the song.</p>
          <p>Click a track in the playlist to open the track editor, and use the start time slider (±0.5 s buttons for fine tuning, Auto Preview to hear it).</p>
          <p>Update the track — the start time is used every time that track plays.</p>
          <HelpChip><Timer className="h-3.5 w-3.5" /> Start time</HelpChip>
        </HelpCard>
      </main>
    </div>
  );
}
