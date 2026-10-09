/**
 * Playlist type colours and labels — Flutter `TypeColor` / `TypeExtension`
 * and `stageTypeColor` (pre-match black → grey on the dark stage).
 * Class names are literal so Tailwind picks them up.
 */
import { DJ_PLAYLIST_TYPE_LABEL, isDJPlaylistType, type DJPlaylistType } from "@/lib/types/djmodels";

/** Order on the home page and in Let's Play. */
export const HOME_TYPE_ORDER: DJPlaylistType[] = ["hotspot", "match", "funStuff", "preMatch", "archived"];

const BG: Record<DJPlaylistType, string> = {
  hotspot: "bg-djtype-hotspot",
  match: "bg-djtype-match",
  funStuff: "bg-djtype-funStuff",
  preMatch: "bg-djtype-preMatch",
  archived: "bg-djtype-archived",
};
const TEXT: Record<DJPlaylistType, string> = {
  hotspot: "text-djtype-hotspot",
  match: "text-djtype-match",
  funStuff: "text-djtype-funStuff",
  preMatch: "text-djtype-preMatch",
  archived: "text-djtype-archived",
};
const BORDER: Record<DJPlaylistType, string> = {
  hotspot: "border-djtype-hotspot",
  match: "border-djtype-match",
  funStuff: "border-djtype-funStuff",
  preMatch: "border-djtype-preMatch",
  archived: "border-djtype-archived",
};

/** Text/icon colour that reads on top of the type colour. */
const ON: Record<DJPlaylistType, string> = {
  hotspot: "text-white",
  match: "text-white",
  funStuff: "text-white",
  preMatch: "text-stage-bg",
  archived: "text-black",
};

const fallback = (t: string): DJPlaylistType => (isDJPlaylistType(t) ? t : "hotspot");

export const typeBg = (t: string) => BG[fallback(t)];
export const typeText = (t: string) => TEXT[fallback(t)];
export const typeBorder = (t: string) => BORDER[fallback(t)];
export const typeOn = (t: string) => ON[fallback(t)];

/** Display label, capitalised like the Flutter chips ("Fun stuff"). */
export function typeLabel(t: string): string {
  const l = isDJPlaylistType(t) ? DJ_PLAYLIST_TYPE_LABEL[t] : t;
  return l.charAt(0).toUpperCase() + l.slice(1);
}
