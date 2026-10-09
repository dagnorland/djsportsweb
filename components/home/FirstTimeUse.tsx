"use client";

/**
 * Welcome screen when there are no playlists yet — port of
 * first_time_use_screen.dart, plus the web's main path to data: restore a
 * cloud backup (made by the Flutter app or another browser).
 * Rendered in the light theme, like Flutter's welcome screen.
 */
import Link from "next/link";
import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { format } from "date-fns";
import { AlertCircle, CheckCircle2, Circle, Cloud, ListPlus, Loader2, Music, Sparkles, Trophy } from "lucide-react";
import { TypeBadge } from "@/components/stage/TypeBadge";
import { SettingKeys, backupProfileKey, getSetting, setSetting } from "@/lib/db/settings-repo";
import { listBackupsForProfile } from "@/lib/firebase/cloud-backup-service";
import type { BackupSummary } from "@/lib/types/djmodels";
import { NEW_PLAYLIST_HREF } from "./HomeAppBar";
import { EXAMPLE_SETUP, loadExampleSetup } from "@/lib/db/playlist-actions";
import { typeLabel } from "@/lib/theme/playlistTypes";

const input =
  "h-10 rounded-lg bg-transparent px-3 text-sm border border-input focus:border-2 focus:border-ring outline-none";

function InfoCard({ icon: Icon, title, children, accent }: {
  icon: typeof Cloud; title: string; children: React.ReactNode; accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-[18px] ${accent ? "border-primary/50 bg-primary/5" : "border-stage-divider bg-stage-surface"}`}>
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-5 w-5" />
        <h3 className="text-base font-bold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-start gap-2.5 text-sm text-stage-muted">
      <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-stage-text text-xs font-bold text-stage-bg">{n}</span>
      <p className="pt-0.5">{children}</p>
    </div>
  );
}

function RestoreSection() {
  const [profile, setProfile] = useState("");
  const [pin, setPin] = useState("");
  const [device, setDevice] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{ backups?: BackupSummary[]; error?: string } | null>(null);

  useEffect(() => {
    Promise.all([
      getSetting<string>(SettingKeys.backupProfile, ""),
      getSetting<string>(SettingKeys.backupPin, ""),
      getSetting<string>(SettingKeys.deviceName, ""),
    ]).then(([p, n, d]) => { setProfile(p); setPin(n); setDevice(d); }).catch(() => {});
  }, []);

  const check = async () => {
    const key = backupProfileKey(profile.trim(), pin);
    if (!key) { setResult({ error: "Enter a Profile name and 4-digit PIN first." }); return; }
    await setSetting(SettingKeys.backupProfile, profile.trim());
    await setSetting(SettingKeys.backupPin, pin);
    if (device.trim()) await setSetting(SettingKeys.deviceName, device.trim());
    setChecking(true);
    setResult(null);
    try {
      setResult({ backups: await listBackupsForProfile(key) });
    } catch (e) {
      setResult({ error: `Could not check for backups: ${e instanceof Error ? e.message : e}` });
    } finally {
      setChecking(false);
    }
  };

  return (
    <InfoCard icon={Cloud} title="Restore from Cloud Backup" accent>
      <p className="mb-3 text-sm text-stage-muted">
        Already using djSports on another device? Enter the same Profile and PIN to get your
        playlists, tracks and start times here.
      </p>
      <div className="flex flex-wrap gap-2">
        <input className={`${input} min-w-[160px] flex-1`} placeholder="Profile name, e.g. Oslo Vikings"
          value={profile} onChange={e => setProfile(e.target.value)} aria-label="Profile name" />
        <input className={`${input} w-24`} placeholder="PIN" type="password" inputMode="numeric"
          value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))} aria-label="PIN" />
      </div>
      <input className={`${input} mt-2 w-full`} placeholder="Device name, e.g. DJ MacBook (web)"
        value={device} onChange={e => setDevice(e.target.value)} aria-label="Device name" />
      <button onClick={check} disabled={checking}
        className="mt-3 inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">
        {checking && <Loader2 className="h-4 w-4 animate-spin" />} {checking ? "Checking…" : "Check for backups"}
      </button>
      {result?.error && <p className="mt-2 text-sm text-red-600">{result.error}</p>}
      {result?.backups && (result.backups.length === 0 ? (
        <p className="mt-2 text-sm text-stage-muted">No cloud backups found for profile &quot;{profile.trim()}&quot;.</p>
      ) : (
        <div className="mt-3 text-sm">
          <p className="font-semibold">{result.backups.length} backup(s) found</p>
          <ul className="my-1 text-stage-muted">
            {result.backups.slice(0, 3).map(b => (
              <li key={b.id}>{b.deviceName} · {format(b.createdAt, "MMM d y  HH:mm")} · {b.playlistCount} playlists · {b.trackCount} tracks</li>
            ))}
          </ul>
          <Link href="/backup" className="mt-1 inline-flex h-10 items-center rounded-full bg-stage-text px-4 font-semibold text-stage-bg">
            Open Cloud Backup
          </Link>
        </div>
      ))}
    </InfoCard>
  );
}

type Entry = { status: "pending" | "syncing" | "done" | "error"; name?: string; trackCount?: number; error?: string };

function ExampleSetupSection() {
  const { data: session } = useSession();
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [running, setRunning] = useState(false);

  const run = async () => {
    if (!session?.accessToken) return;
    setRunning(true);
    setEntries(EXAMPLE_SETUP.map(() => ({ status: "pending" })));
    await loadExampleSetup(session.accessToken, (i, st) =>
      setEntries(list => list && list.map((e, j) => (j === i ? { ...e, ...st } : e))));
    setRunning(false);
  };

  return (
    <InfoCard icon={Sparkles} title="djSports Example Setup">
      <p className="mb-3 text-sm text-stage-muted">
        Creates 5 real Spotify playlists (HotSpot, Match ×2, Fun Stuff, Pre Match) and syncs all
        tracks from Spotify. Requires Spotify connection.
      </p>
      {entries && (
        <ul className="mb-3 space-y-1 text-sm">
          {entries.map((e, i) => (
            <li key={i} className="flex items-center gap-2">
              {e.status === "done" ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                : e.status === "error" ? <AlertCircle className="h-4 w-4 text-red-600" />
                : e.status === "syncing" ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Circle className="h-4 w-4 text-stage-muted" />}
              <span className="font-medium">{e.name ?? typeLabel(EXAMPLE_SETUP[i].type)}</span>
              <span className="text-stage-muted">
                {e.status === "done" ? `${e.trackCount} tracks synced` : e.status === "error" ? e.error : e.status === "pending" ? "Pending" : "Syncing…"}
              </span>
            </li>
          ))}
        </ul>
      )}
      <button onClick={run} disabled={!session || running}
        className="inline-flex h-10 items-center gap-2 rounded-full bg-stage-text px-4 text-sm font-semibold text-stage-bg disabled:opacity-40">
        {running && <Loader2 className="h-4 w-4 animate-spin" />} {running ? "Syncing…" : "Load Example Setup"}
      </button>
    </InfoCard>
  );
}

export function FirstTimeUse() {
  const { data: session } = useSession();
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 pb-16 pt-4">
      <div>
        <div className="flex items-center gap-3.5">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-700 text-white"><Trophy className="h-7 w-7" /></span>
          <h2 className="text-[32px] font-bold">djSports</h2>
        </div>
        <p className="mt-4 text-xl font-semibold">Welcome! Your DJ setup for sports events.</p>
        <p className="mt-2 text-[15px] text-stage-muted">
          djSports puts the right music in your hands — exactly when the moment calls for it.
          Set up your playlists, connect Spotify, and let the game begin.
        </p>
      </div>

      <RestoreSection />

      <InfoCard icon={Music} title="Connect to Spotify">
        {session ? (
          <p className="text-sm text-stage-muted">Connected as <b className="text-stage-text">{session.user?.name}</b>.</p>
        ) : (
          <>
            <Step n={1}>Log in with the Spotify account you use for playback (Premium).</Step>
            <Step n={2}>Approve the permissions when Spotify asks. You only need to do this once.</Step>
            <button onClick={() => signIn("spotify", { callbackUrl: "/home" })}
              className="mt-1 inline-flex h-10 items-center rounded-full bg-[#1DB954] px-4 text-sm font-semibold text-black">
              Login to Spotify
            </button>
          </>
        )}
      </InfoCard>

      <InfoCard icon={Trophy} title="Playlist Types">
        <div className="space-y-2.5">
          <TypeBadge type="hotspot" description="Goals, slam dunks, and direct scoring moments. Drop the banger the second it happens." />
          <TypeBadge type="match" description="Penalties, floor cleaning, time-outs — keep the energy steady during the game." />
          <TypeBadge type="funStuff" description="Get the crowd to cheer, clap, and make noise. Pure audience interaction." />
          <TypeBadge type="preMatch" description="Warm-up and player introductions before the action starts. Build the tension." />
        </div>
      </InfoCard>

      <InfoCard icon={ListPlus} title="Add Your First Playlist">
        <Step n={1}>Open Spotify and go to the playlist you want to use.</Step>
        <Step n={2}>Copy the link: ··· → Share → Copy link to playlist (or the Spotify URI, spotify:playlist:abc123…).</Step>
        <Step n={3}>Click + (New playlist), paste the link, choose the type, and hit Sync to import tracks.</Step>
        <Link href={NEW_PLAYLIST_HREF} className="mt-1 inline-flex h-10 items-center gap-2 rounded-full bg-stage-text px-4 text-sm font-semibold text-stage-bg">
          <ListPlus className="h-4 w-4" /> New playlist
        </Link>
      </InfoCard>

      <ExampleSetupSection />
    </div>
  );
}
