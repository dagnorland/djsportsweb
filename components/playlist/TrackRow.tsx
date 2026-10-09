"use client";

/** One track in the playlist editor — port of widgets/djplaylist_tracks_view.dart. */
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { GripVertical, Music, Pencil, Play, Trash2 } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ConfirmDialog } from "@/components/stage/ConfirmDialog";
import { cn } from "@/lib/utils";
import { typeText } from "@/lib/theme/playlistTypes";
import { formatDuration } from "@/lib/utils/formatTime";
import { hasStartTime, type DJTrack } from "@/lib/types/djmodels";

export function TrackRow({
  id, track, counter, playlistType, onPlay, onEdit, onDelete,
}: {
  id: string;
  track: DJTrack;
  counter: number;
  playlistType: string;
  onPlay: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const start = formatDuration(track.startTime) + (track.startTimeMS > 0 ? `.${track.startTimeMS}` : "");

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("flex items-center gap-2.5 rounded-[10px] bg-stage-surface px-2.5 py-1.5", isDragging && "relative z-10 shadow-lg")}
    >
      <button className="cursor-grab touch-none text-stage-muted" aria-label="Drag to reorder" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg bg-stage-text/10 text-[13px] font-bold">
        {counter}
      </span>
      <button onClick={onPlay} className="group relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-stage-high" aria-label={`Play ${track.name}`}>
        {track.networkImageUri
          ? <img src={track.networkImageUri} alt="" className="h-full w-full object-cover" loading="lazy" />
          : <Music className="m-auto h-5 w-5 text-stage-text/50" />}
        <Play className="absolute inset-0 m-auto h-7 w-7 text-white drop-shadow" fill="currentColor" />
      </button>
      <button onClick={onEdit} className="min-w-0 flex-1 text-left">
        <p className="truncate text-sm font-medium">{track.name} by {track.artist}</p>
        <p className={cn("text-xs", hasStartTime(track) ? "text-stage-muted" : typeText(playlistType))}>
          {start} — {formatDuration(track.duration)}
          {!track.spotifyUri && track.appleMusicId && <span className="ml-2 text-pink-400">Apple Music</span>}
        </p>
      </button>
      <button onClick={onEdit} className="rounded-full p-2 hover:bg-stage-high" aria-label="Edit track"><Pencil className="h-4 w-4" /></button>
      <button onClick={() => setConfirm(true)} className="rounded-full p-2 text-red-500 hover:bg-stage-high" aria-label="Remove track"><Trash2 className="h-4 w-4" /></button>
      <ConfirmDialog
        options={confirm ? {
          title: "Remove Track",
          message: `Remove "${track.name}" by ${track.artist}?\n\nThe track will be removed from this playlist.`,
          confirmLabel: "Remove",
          danger: true,
        } : null}
        onResult={ok => { setConfirm(false); if (ok) onDelete(); }}
      />
    </li>
  );
}
