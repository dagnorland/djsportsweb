import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Background class for a playlist type (Flutter colours). */
export function getPlaylistTypeColor(type: string): string {
  switch (type) {
    case "hotspot": return "bg-djtype-hotspot";
    case "match": return "bg-djtype-match";
    case "funStuff": return "bg-djtype-funStuff";
    case "preMatch": return "bg-djtype-preMatch";
    case "archived": return "bg-djtype-archived";
    default: return "bg-stage-muted";
  }
}
