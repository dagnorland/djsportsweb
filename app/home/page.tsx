"use client";

/** Home — port of djsports_home_page.dart: playlists by type, or the welcome screen. */
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { HomeAppBar } from "@/components/home/HomeAppBar";
import { PlaylistBrowser } from "@/components/home/PlaylistBrowser";
import { FirstTimeUse } from "@/components/home/FirstTimeUse";
import { useDJData } from "@/lib/hooks/useDJData";
import { movePlaylistInType, removeDJPlaylist } from "@/lib/db/playlist-repo";
import { showAppToast } from "@/lib/ui/app-toast";

export default function HomePage() {
  const router = useRouter();
  const { playlists, tracksById } = useDJData();
  const loading = !playlists || !tracksById;
  const empty = !loading && playlists.length === 0;

  return (
    // The welcome screen keeps the light design, like the Flutter app.
    <div className={`${empty ? "light" : ""} min-h-screen bg-stage-bg text-stage-text`}>
      <HomeAppBar hasPlaylists={!loading && !empty} />
      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : empty ? (
        <FirstTimeUse />
      ) : (
        <PlaylistBrowser
          playlists={playlists}
          tracksById={tracksById}
          onEdit={p => router.push(`/playlist/${p.id}`)}
          onDelete={p => removeDJPlaylist(p.id)
            .then(() => showAppToast(`Deleted "${p.name}"`))
            .catch(e => showAppToast("Delete failed", { level: "error", description: String(e) }))}
          onMove={(type, from, to) => { movePlaylistInType(type, from, to).catch(console.error); }}
        />
      )}
    </div>
  );
}
