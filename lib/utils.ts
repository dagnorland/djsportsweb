import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getPlaylistTypeColor(type: string): string {
  switch (type) {
    case "hotspot": return "bg-red-500";
    case "match": return "bg-blue-500";
    case "funStuff": return "bg-green-500";
    case "preMatch": return "bg-yellow-500";
    default: return "bg-gray-500";
  }
}
