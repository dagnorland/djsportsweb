"use client";

/**
 * Settings — the web version of Flutter's settings center
 * (track_time/settings_center_screen.dart + its tabs), in the stage look.
 */
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { ArrowLeft, Cloud, LogOut, User } from "lucide-react";
import { SectionHeader } from "@/components/stage/SectionHeader";
import { ThemeToggle } from "@/components/stage/ThemeToggle";
import { LetsPlaySettingsCard } from "@/components/letsplay/LetsPlaySettingsCard";
import { PlaybackOutputCard } from "@/components/PlaybackOutputCard";
import { DeviceSelector } from "@/components/DeviceSelector";
import { StartTimesSection } from "@/components/settings/StartTimesSection";
import { PlaylistShareSection } from "@/components/settings/PlaylistShareSection";
import { clearLocalStorage } from "@/lib/utils/logout";
import type { PrivateUser } from "@/lib/types";
import packageJson from "@/package.json";

function Section({ id, title, help, children }: { id?: string; title: string; help?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-16 rounded-2xl bg-stage-surface p-5">
      <SectionHeader label={title}>{help}</SectionHeader>
      <div className="mt-3">{children}</div>
    </section>
  );
}

const NAV = [
  ["account", "Account"], ["playback", "Spotify output"], ["letsplay", "Let's Play"],
  ["appearance", "Appearance"], ["starttimes", "Start times"], ["playlists", "Playlists"], ["backup", "Cloud Backup"],
] as const;

export default function SettingsPage() {
  const { data: session } = useSession();
  const [user, setUser] = useState<PrivateUser | null>(null);

  useEffect(() => {
    if (!session?.accessToken) return;
    fetch("https://api.spotify.com/v1/me", { headers: { Authorization: `Bearer ${session.accessToken}` } })
      .then(r => (r.ok ? r.json() : null)).then(setUser).catch(() => {});
  }, [session?.accessToken]);

  const logout = async () => {
    clearLocalStorage();
    await signOut({ redirect: false });
    window.location.href = "/?cleaned=true";
  };

  return (
    <div className="min-h-screen bg-stage-bg text-stage-text">
      <header className="sticky top-0 z-30 bg-stage-bg">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-2">
          <Link href="/home" aria-label="Back" className="rounded-full p-2 hover:bg-stage-high"><ArrowLeft className="h-6 w-6" /></Link>
          <h1 className="flex-1 text-xl font-semibold">Settings</h1>
          <span className="pr-2 text-xs text-stage-muted">v{packageJson.version}</span>
        </div>
        <nav className="mx-auto flex max-w-3xl gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
          {NAV.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="shrink-0 rounded-full bg-stage-high px-3 py-1 text-sm font-semibold hover:bg-stage-divider">{label}</a>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-4 pb-24 pt-2">
        <Section id="account" title="Account" help="Your Spotify account">
          {session ? (
            <div className="flex flex-wrap items-center gap-4">
              {user?.images?.[0]?.url
                ? <img src={user.images[0].url} alt="" className="h-14 w-14 rounded-full object-cover" />
                : <span className="flex h-14 w-14 items-center justify-center rounded-full bg-stage-high"><User className="h-7 w-7" /></span>}
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{user?.display_name ?? session.user?.name}</p>
                <p className="text-sm text-stage-muted">{user?.email ?? session.user?.email}</p>
                {user?.product && (
                  <p className={`text-xs ${user.product === "premium" ? "text-green-500" : "text-orange-400"}`}>
                    {user.product === "premium" ? "Spotify Premium" : "Spotify Free — the djSports player needs Premium"}
                  </p>
                )}
              </div>
              <button onClick={logout} className="inline-flex h-9 items-center gap-2 rounded-full bg-stage-high px-4 text-sm font-medium hover:bg-stage-divider">
                <LogOut className="h-4 w-4" /> Log out
              </button>
            </div>
          ) : (
            <button onClick={() => signIn("spotify", { callbackUrl: "/settings" })} className="inline-flex h-10 items-center rounded-full bg-[#1DB954] px-4 text-sm font-semibold text-black">
              Login to Spotify
            </button>
          )}
          <p className="mt-3 text-xs text-stage-muted">Logging out keeps your playlists, tracks and start times in this browser.</p>
        </Section>

        <Section id="playback" title="Spotify output — this browser plays through" help={'Same as "This Mac plays through" in the djSports app.'}>
          <PlaybackOutputCard />
          {session && (
            <div className="mt-5 border-t border-stage-divider pt-4">
              <p className="mb-1 text-sm font-medium">Preferred Spotify device</p>
              <p className="mb-3 text-sm text-stage-muted">Used with &quot;Spotify device&quot;, and when the djSports player isn&apos;t available.</p>
              <DeviceSelector />
            </div>
          )}
        </Section>

        <Section id="letsplay" title="Let's Play settings">
          <LetsPlaySettingsCard />
        </Section>

        <Section id="appearance" title="Appearance" help="Dark stage look (default) or light theme. Let's Play is always dark.">
          <ThemeToggle />
        </Section>

        <Section id="starttimes" title="Manage track start time list">
          <StartTimesSection />
        </Section>

        <Section id="playlists" title="Playlists" help="Share playlists with other djSports users">
          <PlaylistShareSection />
        </Section>

        <Section id="backup" title="Cloud Backup" help="Back up and restore all playlists, tracks and start times — shared with the djSports app (profile + PIN).">
          <Link href="/backup" className="inline-flex h-9 items-center gap-2 rounded-full bg-stage-high px-4 text-sm font-medium hover:bg-stage-divider">
            <Cloud className="h-4 w-4" /> Open Cloud Backup
          </Link>
        </Section>
      </main>
    </div>
  );
}
