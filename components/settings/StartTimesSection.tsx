"use client";

/** MANAGE TRACK START TIME LIST — port of start_time_tab.dart. */
import { useState } from "react";
import { ClipboardCopy, ListRestart, Trash2, Upload, Wand2 } from "lucide-react";
import { ConfirmDialog, type ConfirmOptions } from "@/components/stage/ConfirmDialog";
import { getDb } from "@/lib/db/djsports-db";
import { useLive } from "@/lib/db/useLive";
import {
  EXAMPLE_TRACK_TIME_JSON, addMissingFromTracks, applyListToTracksWithoutStartTime, deleteTrackTimes,
  exportTrackTimesJson, importTrackTimesJson,
} from "@/lib/db/library-tools";
import { showAppToast } from "@/lib/ui/app-toast";
import { toast } from "sonner";

const btn = "inline-flex h-9 items-center gap-2 rounded-full bg-stage-high px-4 text-sm font-medium hover:bg-stage-divider disabled:opacity-40";
const h = "mb-1 text-xs font-black uppercase tracking-[0.1em] text-stage-muted";

export function StartTimesSection() {
  const list = useLive(() => getDb().trackTime.toArray(), []);
  const total = list?.length ?? 0;
  const zero = list?.filter(t => t.startTime === 0).length ?? 0;
  const [paste, setPaste] = useState("");
  const [confirm, setConfirm] = useState<(ConfirmOptions & { onlyZero: boolean }) | null>(null);

  const run = async (fn: () => Promise<string>) => {
    try { toast.success(await fn()); } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-stage-high/60 p-3 text-sm text-stage-muted">
        <p className="font-semibold text-stage-text">How track start times work</p>
        <p>This list is local to this browser and is not synced with Spotify. Set a start time on a track (e.g. skip the intro) and export the list to keep your start time work for later, or share it — the JSON is the same as in the djSports app. Cloud Backup also includes it.</p>
      </div>

      <div>
        <p className={h}>Update start times list</p>
        <p className="mb-2 text-sm text-stage-muted">Update the list with missing start times from tracks in your playlists.</p>
        <button className={btn} onClick={() => run(async () => {
          const r = await addMissingFromTracks();
          return r.added > 0 ? `Added ${r.added} new track(s) to the export list` : `No new tracks to add — all ${r.total} already in the list`;
        })}><ListRestart className="h-4 w-4" /> Update list from tracks</button>
      </div>

      <div>
        <p className={h}>Export track start times</p>
        <button className={btn} onClick={() => run(async () => {
          const { json, count } = await exportTrackTimesJson();
          await navigator.clipboard.writeText(json);
          return `Copied ${count} track(s) with start times to the clipboard`;
        })}><ClipboardCopy className="h-4 w-4" /> Copy list as JSON ({total} tracks)</button>
      </div>

      <div>
        <p className={h}>Import</p>
        <p className="mb-2 text-sm text-stage-muted">To restore track start times from a manual backup, paste the JSON here. You currently have {total} track start time(s) in the list.</p>
        <textarea
          className="min-h-[120px] w-full rounded-lg border border-input bg-transparent p-3 font-mono text-xs outline-none focus:border-2 focus:border-ring"
          placeholder={`Paste JSON here, then press Update below\n\nExample:\n${EXAMPLE_TRACK_TIME_JSON}`}
          value={paste}
          onChange={e => setPaste(e.target.value)}
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <button className={btn} disabled={!paste.trim()} onClick={() => run(async () => {
            const n = await importTrackTimesJson(paste);
            setPaste("");
            return n > 0 ? `Added ${n} track start time(s)` : "No new entries — all already in the list.";
          })}><Upload className="h-4 w-4" /> Update list with pasted data</button>
          <button className={btn} onClick={() => run(async () => {
            const n = await applyListToTracksWithoutStartTime();
            return n > 0 ? `Updated ${n} track(s) with start times from the list` : "No matches found — none of the tracks without a start time are in the list";
          })}><Wand2 className="h-4 w-4" /> Update all tracks with no start time from list</button>
        </div>
      </div>

      <div>
        <p className={h}>Delete</p>
        <div className="flex flex-wrap gap-2">
          <button className={btn} disabled={zero === 0} onClick={() => setConfirm({
            title: "Confirm deletion", message: `Delete ${zero} entries with no start time?`, confirmLabel: "Delete", danger: true, onlyZero: true,
          })}><Trash2 className="h-4 w-4" /> Delete entries with no start time ({zero})</button>
          <button className={`${btn} text-red-500`} disabled={total === 0} onClick={() => setConfirm({
            title: "Confirm deletion", message: `Delete all ${total} track start times from the list? Start times on your tracks are kept.`, confirmLabel: "Delete all", danger: true, onlyZero: false,
          })}><Trash2 className="h-4 w-4" /> Delete list</button>
        </div>
      </div>

      <ConfirmDialog options={confirm} onResult={async ok => {
        const c = confirm; setConfirm(null);
        if (ok && c) showAppToast(`Deleted ${await deleteTrackTimes(c.onlyZero)} entries`, { level: "warning" });
      }} />
    </div>
  );
}
