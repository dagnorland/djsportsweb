"use client";

/** PLAYLISTS — copy / import playlists as JSON (playlists_tab.dart). */
import { useState } from "react";
import { ClipboardCopy, Upload } from "lucide-react";
import { toast } from "sonner";
import { getDb } from "@/lib/db/djsports-db";
import { useLive } from "@/lib/db/useLive";
import { exportPlaylistsJson, importPlaylistsJson } from "@/lib/db/library-tools";

const btn = "inline-flex h-9 items-center gap-2 rounded-full bg-stage-high px-4 text-sm font-medium hover:bg-stage-divider disabled:opacity-40";
const example = '[\n  {"playlistUri":"7mpOe1Luw2gNjG7x8EgeLJ","playlistType":"hotspot","name":"Score"}\n]';

export function PlaylistShareSection() {
  const count = useLive(() => getDb().djplaylist.count(), []) ?? 0;
  const [paste, setPaste] = useState("");
  return (
    <div className="space-y-3">
      <p className="text-sm text-stage-muted">
        You have {count} playlist(s) in your library. Copy all playlists and share them with other djSports users (mail, direct
        message …). They paste the data below to recreate the same playlists — then open each playlist and Sync to get the tracks.
      </p>
      <button className={btn} onClick={async () => {
        const { json, count } = await exportPlaylistsJson();
        await navigator.clipboard.writeText(json);
        toast.success(`Copied ${count} playlist(s) to clipboard`);
      }}><ClipboardCopy className="h-4 w-4" /> Copy playlists as JSON (URI + type + name)</button>
      <textarea
        className="min-h-[100px] w-full rounded-lg border border-input bg-transparent p-3 font-mono text-xs outline-none focus:border-2 focus:border-ring"
        placeholder={`Paste JSON from "Copy playlists" here\n\nExample:\n${example}`}
        value={paste}
        onChange={e => setPaste(e.target.value)}
      />
      <button className={btn} disabled={!paste.trim()} onClick={async () => {
        try {
          const { added, skipped } = await importPlaylistsJson(paste);
          setPaste("");
          toast.success(added > 0
            ? `Added ${added} playlist(s)${skipped ? `, ${skipped} already existed` : ""}. Open each playlist to sync tracks from Spotify.`
            : "No new playlists — all already in your library.");
        } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); }
      }}><Upload className="h-4 w-4" /> Import playlists from JSON</button>
    </div>
  );
}
