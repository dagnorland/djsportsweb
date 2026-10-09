"use client";

/**
 * The home page's playlists, Spotify-style: chips to pick a type at the
 * top; "All" shows one horizontal shelf per type (two side by side when both
 * fit), a single type shows a grid. Drag to reorder within a shelf — the
 * order drives Let's Play. Port of widgets/playlist_browser.dart.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext, PointerSensor, TouchSensor, KeyboardSensor, closestCenter,
  useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, horizontalListSortingStrategy, sortableKeyboardCoordinates, useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { HOME_TYPE_ORDER, typeBg, typeLabel, typeText } from "@/lib/theme/playlistTypes";
import type { DJPlaylist, DJPlaylistType, DJTrack } from "@/lib/types/djmodels";
import { CARD_TEXT_HEIGHT, PlaylistCard } from "./PlaylistCard";

type Section = { type: DJPlaylistType; playlists: DJPlaylist[] };

const PAIR_GAP = 24;
/** Width a shelf needs to show all cards (8 px card padding each side + 8 px list padding). */
const shelfWidth = (cards: number, cardWidth: number) => cards * (cardWidth + 16) + 16;

/** Two neighbouring sections share a row when both fit in half the width. */
function pairUp(sections: Section[], cardWidth: number, width: number): Section[][] {
  const half = (width - PAIR_GAP) / 2;
  const fits = (s: Section) => shelfWidth(s.playlists.length, cardWidth) <= half;
  const rows: Section[][] = [];
  for (let i = 0; i < sections.length;) {
    if (i + 1 < sections.length && fits(sections[i]) && fits(sections[i + 1])) {
      rows.push([sections[i], sections[i + 1]]); i += 2;
    } else {
      rows.push([sections[i]]); i += 1;
    }
  }
  return rows;
}

const label = (t: DJPlaylistType) => (t === "preMatch" ? "Pre-match" : t === "funStuff" ? "Fun Stuff" : typeLabel(t));

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

export function PlaylistBrowser({
  playlists, tracksById, onEdit, onDelete, onMove,
}: {
  playlists: DJPlaylist[];
  tracksById: Map<string, DJTrack>;
  onEdit: (p: DJPlaylist) => void;
  onDelete: (p: DJPlaylist) => void;
  onMove: (type: string, from: number, to: number) => void;
}) {
  const [filter, setFilter] = useState<DJPlaylistType | null>(null);
  const [ref, width] = useWidth<HTMLDivElement>();

  const sections = useMemo<Section[]>(() => HOME_TYPE_ORDER
    .map(type => ({
      type,
      playlists: playlists.filter(p => p.type === type).sort((a, b) => a.position - b.position),
    }))
    .filter(s => s.playlists.length > 0), [playlists]);

  // A filter whose type has no playlists any more falls back to All.
  const active = filter && sections.some(s => s.type === filter) ? filter : null;

  // Phones: ~2.2 cards per shelf; wide screens: fixed 210 px.
  const cardWidth = Math.min(230, Math.max(140, width >= 700 ? 210 : (width - 32) / 2.2));

  return (
    <div ref={ref} className="flex flex-col">
      <TypeChips sections={sections} selected={active} total={playlists.length} onSelect={setFilter} />
      {width > 0 && (active == null ? (
        <div className="pb-6">
          {pairUp(sections, cardWidth, width).map(row => (
            <div key={row.map(s => s.type).join("-")} className="flex items-start" style={{ gap: PAIR_GAP }}>
              {row.map(s => (
                <div key={s.type} className="min-w-0 flex-1">
                  <Shelf section={s} cardWidth={cardWidth} tracksById={tracksById}
                    onEdit={onEdit} onDelete={onDelete} onMove={(f, t) => onMove(s.type, f, t)} />
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <TypeGrid
          playlists={sections.find(s => s.type === active)!.playlists}
          width={width}
          maxCardWidth={Math.max(cardWidth * 1.25, 160)}
          tracksById={tracksById}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

function TypeChips({
  sections, selected, total, onSelect,
}: { sections: Section[]; selected: DJPlaylistType | null; total: number; onSelect: (t: DJPlaylistType | null) => void }) {
  const chip = "inline-flex shrink-0 items-center gap-2 h-8 rounded-full px-3 text-sm font-semibold transition-colors";
  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-2 [scrollbar-width:none]">
      <button
        className={cn(chip, selected == null ? "bg-stage-text text-stage-bg" : "bg-stage-high text-stage-text")}
        onClick={() => onSelect(null)}
      >
        All {total}
      </button>
      {sections.map(s => {
        const on = selected === s.type;
        return (
          <button
            key={s.type}
            className={cn(chip, on ? cn(typeBg(s.type), "text-white") : "bg-stage-high text-stage-text")}
            onClick={() => onSelect(s.type)}
          >
            <span className={cn("h-2.5 w-2.5 rounded-full", on ? "bg-white" : typeBg(s.type))} />
            {label(s.type)} {s.playlists.length}
          </button>
        );
      })}
    </div>
  );
}

function Shelf({
  section, cardWidth, tracksById, onEdit, onDelete, onMove,
}: {
  section: Section;
  cardWidth: number;
  tracksById: Map<string, DJTrack>;
  onEdit: (p: DJPlaylist) => void;
  onDelete: (p: DJPlaylist) => void;
  onMove: (from: number, to: number) => void;
}) {
  // Mouse: drag after moving 6 px (a click still edits). Touch: long-press.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 350, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ids = section.playlists.map(p => p.id);
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    onMove(ids.indexOf(String(e.active.id)), ids.indexOf(String(e.over.id)));
  };

  return (
    <section>
      <div className="flex items-center gap-2 px-4 pb-2 pt-4">
        <span className={cn("h-[18px] w-1", typeBg(section.type))} />
        <h2 className={cn("text-sm font-black uppercase tracking-[0.09em]", typeText(section.type))}>
          {label(section.type)}
        </h2>
        <span className="text-[13px] text-stage-muted">{section.playlists.length}</span>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ids} strategy={horizontalListSortingStrategy}>
          <div
            className="flex overflow-x-auto px-2 [scrollbar-width:thin]"
            style={{ height: cardWidth + CARD_TEXT_HEIGHT }}
          >
            {section.playlists.map(p => (
              <SortableCard key={p.id} id={p.id}>
                {dragging => (
                  <PlaylistCard playlist={p} tracksById={tracksById} width={cardWidth}
                    onEdit={() => onEdit(p)} onDelete={() => onDelete(p)} dragging={dragging} />
                )}
              </SortableCard>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
}

function SortableCard({ id, children }: { id: string; children: (dragging: boolean) => React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn("shrink-0 px-2", isDragging && "z-10")}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
    >
      {children(isDragging)}
    </div>
  );
}

function TypeGrid({
  playlists, width, maxCardWidth, tracksById, onEdit, onDelete,
}: {
  playlists: DJPlaylist[];
  width: number;
  maxCardWidth: number;
  tracksById: Map<string, DJTrack>;
  onEdit: (p: DJPlaylist) => void;
  onDelete: (p: DJPlaylist) => void;
}) {
  const spacing = 20, padding = 16;
  const inner = width - padding * 2;
  const cols = Math.max(1, Math.ceil((inner + spacing) / (maxCardWidth + spacing)));
  const cardWidth = (inner - spacing * (cols - 1)) / cols;
  return (
    <div
      className="grid px-4 pb-6 pt-2"
      style={{ gridTemplateColumns: `repeat(${cols}, ${cardWidth}px)`, gap: spacing }}
    >
      {playlists.map(p => (
        <PlaylistCard key={p.id} playlist={p} tracksById={tracksById} width={cardWidth}
          onEdit={() => onEdit(p)} onDelete={() => onDelete(p)} />
      ))}
    </div>
  );
}
