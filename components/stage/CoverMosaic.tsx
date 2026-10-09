/**
 * Playlist cover: one image, or a 2×2 mosaic when there are four different
 * covers; a type-coloured gradient with a music icon when there are none.
 * Port of `_Cover` in playlist_card.dart.
 */
/* eslint-disable @next/next/no-img-element */
import { CloudOff, ListMusic } from "lucide-react";
import { cn } from "@/lib/utils";
import { typeText } from "@/lib/theme/playlistTypes";

function Img({ src }: { src: string }) {
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      className="h-full w-full object-cover"
      onError={e => {
        const el = e.currentTarget;
        el.style.display = "none";
        el.parentElement?.classList.add("bg-stage-high");
      }}
    />
  );
}

/** First four distinct cover URLs in track order. */
export function pickCovers(uris: string[]): string[] {
  const out: string[] = [];
  for (const u of uris) {
    if (u && !out.includes(u)) out.push(u);
    if (out.length === 4) break;
  }
  return out;
}

export function CoverMosaic({ covers, type, className }: { covers: string[]; type: string; className?: string }) {
  if (covers.length === 0) {
    return (
      <div className={cn("relative h-full w-full overflow-hidden bg-stage-high", className)}>
        <div className={cn("absolute inset-0 bg-gradient-to-br from-current to-transparent opacity-60", typeText(type))} />
        <ListMusic className="absolute inset-0 m-auto h-12 w-12 text-white/55" />
      </div>
    );
  }
  if (covers.length < 4) {
    return <div className={cn("h-full w-full overflow-hidden", className)}><Img src={covers[0]} /></div>;
  }
  return (
    <div className={cn("grid h-full w-full grid-cols-2 grid-rows-2 overflow-hidden", className)}>
      {covers.map(c => <div key={c} className="overflow-hidden"><Img src={c} /></div>)}
    </div>
  );
}

export function CoverPlaceholder({ empty }: { empty?: boolean }) {
  const Icon = empty ? ListMusic : CloudOff;
  return (
    <div className="flex h-full w-full items-center justify-center bg-stage-high">
      <Icon className="h-1/2 w-1/2 text-stage-text/25" />
    </div>
  );
}
