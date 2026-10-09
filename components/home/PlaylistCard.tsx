"use client";

/**
 * A playlist on the home page, Spotify-style: square cover (2×2 mosaic of
 * the first four different covers), type-colour strip along the bottom,
 * round edit button in the type colour, ⋮ menu, name + counts below.
 * Click anywhere to edit. Port of widgets/playlist_card.dart.
 */
import { ExternalLink, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CoverMosaic, pickCovers } from "@/components/stage/CoverMosaic";
import { RoundTypeButton } from "@/components/stage/RoundTypeButton";
import { ConfirmDialog } from "@/components/stage/ConfirmDialog";
import { typeBg } from "@/lib/theme/playlistTypes";
import { cn } from "@/lib/utils";
import { spotifyIdFromUri } from "@/lib/db/codec";
import { hasStartTime, type DJPlaylist, type DJTrack } from "@/lib/types/djmodels";

/** Height of the text below the cover (two title lines + counts). */
export const CARD_TEXT_HEIGHT = 64;

export function PlaylistCard({
  playlist, tracksById, width, onEdit, onDelete, dragging,
}: {
  playlist: DJPlaylist;
  tracksById: Map<string, DJTrack>;
  width: number;
  onEdit: () => void;
  onDelete: () => void;
  dragging?: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const tracks = playlist.trackIds.map(id => tracksById.get(id)).filter((t): t is DJTrack => !!t);
  const covers = pickCovers(tracks.map(t => t.networkImageUri));
  const withStart = tracks.filter(hasStartTime).length;
  const button = Math.min(46, Math.max(32, width * 0.24));
  const spotifyId = spotifyIdFromUri(playlist.spotifyUri);

  return (
    <div
      className={cn("group cursor-pointer select-none", dragging && "opacity-80 scale-[1.03]")}
      style={{ width }}
      onClick={onEdit}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === "Enter") onEdit(); }}
      aria-label={`Edit ${playlist.name}`}
    >
      <div className="relative aspect-square">
        <CoverMosaic covers={covers} type={playlist.type} className="rounded-lg" />
        <div className={cn("absolute inset-x-0 bottom-0 h-1 rounded-b-lg", typeBg(playlist.type))} />
        <div className="absolute right-1 top-1" onClick={e => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-black/55 text-white"
              aria-label="More"
              onPointerDown={e => e.stopPropagation()}
            >
              <MoreVertical className="h-[18px] w-[18px]" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {spotifyId && (
                <DropdownMenuItem asChild>
                  <a href={`https://open.spotify.com/playlist/${spotifyId}`} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-2.5 h-4 w-4" /> Open in Spotify
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="text-red-500 focus:text-red-500" onSelect={() => setConfirmDelete(true)}>
                <Trash2 className="mr-2.5 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="absolute bottom-3 right-2 opacity-95">
          <RoundTypeButton
            type={playlist.type}
            icon={Pencil}
            size={button}
            label={`Edit ${playlist.name}`}
            onClick={e => { e.stopPropagation(); onEdit(); }}
          />
        </div>
      </div>
      <div className="pt-2" style={{ height: CARD_TEXT_HEIGHT }}>
        <p className="line-clamp-2 text-sm font-bold leading-tight text-stage-text">{playlist.name}</p>
        <p className="mt-0.5 truncate text-xs text-stage-muted">
          {tracks.length} tracks{withStart > 0 && ` · ${withStart} with start`}
        </p>
      </div>
      <div onClick={e => e.stopPropagation()}>
        <ConfirmDialog
          options={confirmDelete ? {
            title: "Delete Playlist",
            message: `Delete "${playlist.name}"?\n\nThis will permanently remove the playlist and all its tracks.`,
            confirmLabel: "Delete",
            danger: true,
          } : null}
          onResult={ok => { setConfirmDelete(false); if (ok) onDelete(); }}
        />
      </div>
    </div>
  );
}
