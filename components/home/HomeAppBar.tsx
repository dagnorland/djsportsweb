"use client";

/**
 * Home app bar — port of the AppBar in djsports_home_page.dart.
 * Wide (≥1000 px): version left, title centred, icon actions + Let's Play.
 * Narrow: title with version below, Spotify chip, Let's Play logo, ⋮ menu.
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { Cloud, HandMetal, ListPlus, MoreVertical, Plus, Settings } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FlashingLogo } from "@/components/stage/FlashingLogo";
import { cn } from "@/lib/utils";
import packageJson from "@/package.json";

export const LETS_PLAY_LABEL = "Let's Play!";
export const LETS_PLAY_HREF = "/letsplay";
export const NEW_PLAYLIST_HREF = "/playlist/new";

const version = `v${packageJson.version}`;

export function SpotifyStatusChip({ compact }: { compact?: boolean }) {
  const { data: session, status } = useSession();
  if (status === "loading") return null;
  if (!session) {
    return (
      <button
        onClick={() => signIn("spotify", { callbackUrl: "/home" })}
        className="inline-flex h-8 items-center gap-2 rounded-full bg-[#1DB954] px-3 text-sm font-semibold text-black"
      >
        <span className="h-2 w-2 rounded-full bg-black/60" /> {compact ? "Spotify" : "Connect Spotify"}
      </button>
    );
  }
  return (
    <span
      className="inline-flex h-8 max-w-[200px] items-center gap-2 rounded-full bg-stage-high px-3 text-sm"
      title={`Spotify: ${session.user?.name ?? session.user?.email ?? ""}`}
    >
      <span className="h-2 w-2 shrink-0 rounded-full bg-[#1DB954]" />
      {!compact && <span className="truncate">{session.user?.name ?? "Spotify"}</span>}
    </span>
  );
}

function LetsPlayLogoButton({ showLabel }: { showLabel?: boolean }) {
  const router = useRouter();
  const open = () => router.push(LETS_PLAY_HREF);
  return (
    <span className="inline-flex items-center gap-1.5">
      <FlashingLogo size={40} title={LETS_PLAY_LABEL} onClick={open} />
      {showLabel && (
        <button onClick={open} className="text-base font-extrabold">{LETS_PLAY_LABEL}</button>
      )}
    </span>
  );
}

const iconBtn = "inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-stage-high";

export function HomeAppBar({ hasPlaylists }: { hasPlaylists: boolean }) {
  return (
    <header className="sticky top-0 z-40 bg-stage-bg">
      {/* Wide */}
      <div className="hidden h-14 items-center px-2 min-[1000px]:flex">
        <span className="w-40 pl-2 text-xs text-stage-muted">{version}</span>
        <h1 className="flex-1 text-center text-xl font-bold">djsports</h1>
        <div className="flex items-center gap-1">
          <Link href="/backup" className={iconBtn} title="Cloud Backup" aria-label="Cloud Backup"><Cloud className="h-5 w-5" /></Link>
          <Link href="/settings" className={iconBtn} title="Utilities" aria-label="Settings"><Settings className="h-5 w-5" /></Link>
          <Link href={NEW_PLAYLIST_HREF} className={iconBtn} title="New playlist" aria-label="New playlist"><Plus className="h-5 w-5" /></Link>
          <SpotifyStatusChip />
          {hasPlaylists && <span className="ml-1 mr-2"><LetsPlayLogoButton showLabel /></span>}
        </div>
      </div>

      {/* Narrow */}
      <div className="flex h-14 items-center gap-1 px-2 min-[1000px]:hidden">
        <div className="w-24" />
        <div className="flex flex-1 flex-col items-center leading-tight">
          <h1 className="text-base font-bold">djsports</h1>
          <span className="text-xs text-stage-muted">{version}</span>
        </div>
        <div className="flex items-center gap-1">
          <SpotifyStatusChip compact />
          {hasPlaylists && <LetsPlayLogoButton />}
          <DropdownMenu>
            <DropdownMenuTrigger className={iconBtn} aria-label="Menu"><MoreVertical className="h-5 w-5" /></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {hasPlaylists && (
                <DropdownMenuItem asChild>
                  <Link href={LETS_PLAY_HREF} className={cn("my-1 rounded-lg bg-green-700 font-semibold text-white focus:bg-green-800 focus:text-white")}>
                    <HandMetal className="mr-2.5 h-4 w-4" /> {LETS_PLAY_LABEL}
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild><Link href={NEW_PLAYLIST_HREF}><ListPlus className="mr-2.5 h-4 w-4" /> New playlist</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/settings"><Settings className="mr-2.5 h-4 w-4" /> Settings</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/backup"><Cloud className="mr-2.5 h-4 w-4" /> Cloud Backup</Link></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
