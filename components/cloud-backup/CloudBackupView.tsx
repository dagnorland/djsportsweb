"use client";

/**
 * Cloud Backup — port of djsports/lib/features/cloud_backup/cloud_backup_screen.dart
 * in the dark stage look. Backups are shared with the Flutter app.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import {
  ArrowDown, ArrowLeft, CloudUpload, Eye, EyeOff, Loader2, RefreshCw, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { SectionHeader } from "@/components/stage/SectionHeader";
import { ConfirmDialog, type ConfirmOptions } from "@/components/stage/ConfirmDialog";
import {
  createBackup, deleteBackup, listBackupsForProfile, restoreBackup, syncBackup,
} from "@/lib/firebase/cloud-backup-service";
import { SettingKeys, backupProfileKey, getSetting, setSetting } from "@/lib/db/settings-repo";
import getCurrentUser from "@/lib/spotify/users/getCurrentUser";
import type { BackupSummary } from "@/lib/types/djmodels";

const inputCls =
  "h-10 rounded-lg bg-transparent px-3 text-sm text-stage-text placeholder:text-stage-text/40 " +
  "border border-input focus:border-2 focus:border-ring outline-none";
const buttonCls =
  "inline-flex items-center justify-center gap-2 h-10 px-4 rounded-full text-sm font-semibold " +
  "bg-stage-high text-stage-text hover:bg-stage-divider disabled:opacity-40 disabled:pointer-events-none";

const fmtDate = (d: Date) => format(d, "MMM d y  HH:mm");

function defaultDeviceName(): string {
  if (typeof navigator === "undefined") return "Web";
  const ua = navigator.userAgent;
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome"
    : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser";
  const os = /Mac/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows"
    : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Linux/.test(ua) ? "Linux" : "";
  return `Web ${browser}${os ? ` (${os})` : ""}`;
}

export function CloudBackupView() {
  const { data: session } = useSession();
  const [spotifyUser, setSpotifyUser] = useState<{ id: string; name: string } | null>(null);

  // Saved settings
  const [savedProfile, setSavedProfile] = useState("");
  const [savedPin, setSavedPin] = useState("");
  const profileKey = backupProfileKey(savedProfile, savedPin);

  // Form fields
  const [profile, setProfile] = useState("");
  const [pin, setPin] = useState("");
  const [pinVisible, setPinVisible] = useState(false);
  const [deviceName, setDeviceName] = useState("");

  const [backups, setBackups] = useState<BackupSummary[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isBusy, setIsBusy] = useState(false); // restore / sync
  const [progress, setProgress] = useState<string | null>(null);
  const [status, setStatus] = useState<{ msg: string; error: boolean } | null>(null);

  const [confirm, setConfirm] = useState<ConfirmOptions | null>(null);
  const confirmResolve = useRef<((ok: boolean) => void) | null>(null);
  const ask = (o: ConfirmOptions) =>
    new Promise<boolean>(resolve => { confirmResolve.current = resolve; setConfirm(o); });
  const onConfirmResult = (ok: boolean) => {
    setConfirm(null);
    confirmResolve.current?.(ok);
    confirmResolve.current = null;
  };

  const showStatus = (msg: string, error = false) => setStatus({ msg, error });

  // Load settings
  useEffect(() => {
    Promise.all([
      getSetting<string>(SettingKeys.backupProfile, ""),
      getSetting<string>(SettingKeys.backupPin, ""),
      getSetting<string>(SettingKeys.deviceName, ""),
    ]).then(([p, n, d]) => {
      setSavedProfile(p); setProfile(p);
      setSavedPin(n); setPin(n);
      setDeviceName(d || defaultDeviceName());
    }).catch(err => showStatus(`Could not read settings: ${err}`, true));
  }, []);

  // Spotify user (optional — only used as backup metadata)
  useEffect(() => {
    if (!session?.accessToken) return;
    getCurrentUser(session.accessToken)
      .then(u => setSpotifyUser({ id: u.id, name: u.display_name ?? u.id }))
      .catch(() => { /* not required for backups */ });
  }, [session?.accessToken]);

  const loadBackups = useCallback(async () => {
    if (!profileKey) { setBackups(null); return; }
    setLoadingList(true);
    setListError(null);
    try {
      setBackups(await listBackupsForProfile(profileKey));
    } catch (e) {
      setListError(`Failed to load backups: ${e instanceof Error ? e.message : e}`);
    } finally {
      setLoadingList(false);
    }
  }, [profileKey]);

  useEffect(() => { loadBackups(); }, [loadBackups]);

  const saveProfile = async () => {
    const p = profile.trim();
    if (!/^\d{4}$/.test(pin)) { toast.error("PIN must be exactly 4 digits."); return; }
    await setSetting(SettingKeys.backupProfile, p);
    await setSetting(SettingKeys.backupPin, pin);
    setSavedProfile(p);
    setSavedPin(pin);
    toast.success("Profile & PIN saved.");
  };

  const saveDeviceName = async () => {
    await setSetting(SettingKeys.deviceName, deviceName.trim());
    toast.success("Device name saved.");
  };

  const doBackup = async () => {
    setStatus(null);
    setIsSaving(true);
    try {
      await createBackup({
        profileName: profileKey,
        spotifyUserId: spotifyUser?.id ?? "",
        spotifyDisplayName: spotifyUser?.name ?? "",
        deviceName: deviceName.trim() || defaultDeviceName(),
      });
      showStatus("Backup created successfully.");
      await loadBackups();
    } catch (e) {
      showStatus(`Backup failed: ${e instanceof Error ? e.message : e}`, true);
    } finally {
      setIsSaving(false);
    }
  };

  const doRestore = async (b: BackupSummary) => {
    const ok = await ask({
      title: "Restore backup?",
      message:
        `This will replace ALL local playlists, tracks, and timings with the backup ` +
        `from ${b.deviceName} (${fmtDate(b.createdAt)}).\n\nThis cannot be undone.`,
      confirmLabel: "Restore",
      danger: true,
    });
    if (!ok) return;
    setStatus(null);
    setIsBusy(true);
    try {
      const [p, t] = await restoreBackup(b.id, setProgress);
      showStatus(`Restored ${p} playlists and ${t} tracks.`);
    } catch (e) {
      showStatus(`Restore failed: ${e instanceof Error ? e.message : e}`, true);
    } finally {
      setProgress(null);
      setIsBusy(false);
    }
  };

  const doSync = async (b: BackupSummary) => {
    const ok = await ask({
      title: "Sync from backup?",
      message:
        `Playlists from ${b.deviceName} (${fmtDate(b.createdAt)}) will be added if they ` +
        `are not already present locally (matched by Spotify URI). Existing playlists are not changed.`,
      confirmLabel: "Sync",
    });
    if (!ok) return;
    setStatus(null);
    setIsBusy(true);
    try {
      const { added, skipped } = await syncBackup(b.id, setProgress);
      showStatus(`Sync complete — added ${added} playlist(s), skipped ${skipped}.`);
    } catch (e) {
      showStatus(`Sync failed: ${e instanceof Error ? e.message : e}`, true);
    } finally {
      setProgress(null);
      setIsBusy(false);
    }
  };

  const doDelete = async (b: BackupSummary) => {
    const ok = await ask({
      title: "Delete backup?",
      message: `Delete backup from ${b.deviceName} (${fmtDate(b.createdAt)})?`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    setStatus(null);
    try {
      await deleteBackup(b.id);
      showStatus("Backup deleted.");
      await loadBackups();
    } catch (e) {
      showStatus(`Delete failed: ${e instanceof Error ? e.message : e}`, true);
    }
  };

  return (
    <div className="min-h-screen bg-stage-bg text-stage-text">
      <header className="flex items-center gap-2 h-14 px-2 max-w-3xl mx-auto">
        <Link href="/playlists" aria-label="Back" className="p-2 rounded-full hover:bg-stage-high">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-semibold">Cloud Backup</h1>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16 space-y-6">
        {/* Profile */}
        <section>
          <SectionHeader label="Profile">
            Shared name + 4-digit PIN used to group backups across all your devices.
            Every device with the same Profile and PIN sees the same backups.
          </SectionHeader>
          <div className="flex flex-wrap gap-2">
            <input
              className={`${inputCls} flex-1 min-w-[180px]`}
              value={profile}
              onChange={e => setProfile(e.target.value)}
              placeholder="Profile name, e.g. Oslo Vikings"
              aria-label="Profile name"
            />
            <div className="relative w-[120px]">
              <input
                className={`${inputCls} w-full pr-9`}
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                type={pinVisible ? "text" : "password"}
                inputMode="numeric"
                placeholder="PIN"
                aria-label="PIN"
              />
              <button
                type="button"
                onClick={() => setPinVisible(v => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-stage-muted hover:text-stage-text"
                aria-label={pinVisible ? "Hide PIN" : "Show PIN"}
              >
                {pinVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <button className={buttonCls} onClick={saveProfile}>Save</button>
          </div>
          {!profileKey && (
            <p className="mt-1.5 text-[13px] text-orange-400">
              Set a Profile name and 4-digit PIN to enable cloud backup.
            </p>
          )}
        </section>

        {/* Device name */}
        <section>
          <SectionHeader label="Device name">Used to label backups from this device.</SectionHeader>
          <div className="flex gap-2">
            <input
              className={`${inputCls} flex-1`}
              value={deviceName}
              onChange={e => setDeviceName(e.target.value)}
              aria-label="Device name"
            />
            <button className={buttonCls} onClick={saveDeviceName}>Save</button>
          </div>
        </section>

        {/* Backup */}
        <section>
          <SectionHeader label="Backup">
            Creates a snapshot of all playlists, tracks and timings in Firestore.
            Keeps the last 5 per device.
          </SectionHeader>
          <button
            className={buttonCls}
            onClick={doBackup}
            disabled={isSaving || isBusy || !profileKey}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudUpload className="h-4 w-4" />}
            {isSaving ? "Backing up…" : "Backup Now"}
          </button>
          {status && (
            <p className={`mt-2 text-[13px] select-text ${status.error ? "text-red-500" : "text-green-500"}`}>
              {status.msg}
            </p>
          )}
          {progress && (
            <p className="mt-4 flex items-center gap-2.5 text-[13px]">
              <Loader2 className="h-4 w-4 animate-spin" /> {progress}
            </p>
          )}
        </section>

        {/* Existing backups */}
        <section>
          <div className="flex items-start justify-between gap-2">
            <SectionHeader label="Existing backups">
              {"Full restore — replaces all local data with the backup.\nSync (↓) — adds only playlists not already present locally."}
            </SectionHeader>
            {profileKey && (
              <button
                onClick={loadBackups}
                disabled={loadingList}
                className="p-2 rounded-full text-stage-muted hover:text-stage-text hover:bg-stage-high"
                aria-label="Refresh"
              >
                <RefreshCw className={`h-4 w-4 ${loadingList ? "animate-spin" : ""}`} />
              </button>
            )}
          </div>

          {!profileKey ? (
            <p className="text-stage-muted">Set a Profile name above to see your backups.</p>
          ) : listError ? (
            <p className="text-[13px] text-red-500 select-text">{listError}</p>
          ) : backups === null ? (
            <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : backups.length === 0 ? (
            <p className="text-stage-muted">No backups yet.</p>
          ) : (
            <ul className="space-y-2">
              {backups.map(b => (
                <BackupTile
                  key={b.id}
                  backup={b}
                  isBusy={isBusy}
                  onRestore={() => doRestore(b)}
                  onSync={() => doSync(b)}
                  onDelete={() => doDelete(b)}
                />
              ))}
            </ul>
          )}
        </section>
      </main>

      <ConfirmDialog options={confirm} onResult={onConfirmResult} />
    </div>
  );
}

function BackupTile({
  backup, isBusy, onRestore, onSync, onDelete,
}: {
  backup: BackupSummary;
  isBusy: boolean;
  onRestore: () => void;
  onSync: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl bg-stage-surface px-4 py-3">
      <div className="flex-1 min-w-[200px]">
        <p className="font-medium truncate">{backup.deviceName || "Unknown device"}</p>
        <p className="text-sm text-stage-muted">{fmtDate(backup.createdAt)}</p>
        <p className="text-sm text-stage-muted">
          {backup.playlistCount} playlists · {backup.trackCount} tracks · {backup.tracksWithStartTime} with start time
        </p>
      </div>
      <div className="flex items-center gap-1 ml-auto">
      <button
        onClick={onRestore}
        disabled={isBusy}
        className="px-3 h-9 rounded-full text-sm font-medium hover:bg-stage-high disabled:opacity-40"
      >
        Full restore
      </button>
      <button
        onClick={onSync}
        disabled={isBusy}
        title="Sync (add missing playlists only)"
        aria-label="Sync (add missing playlists only)"
        className="p-2 rounded-full hover:bg-stage-high disabled:opacity-40"
      >
        <ArrowDown className="h-5 w-5" />
      </button>
      <button
        onClick={onDelete}
        title="Delete backup"
        aria-label="Delete backup"
        className="p-2 rounded-full text-red-500 hover:bg-stage-high"
      >
        <Trash2 className="h-5 w-5" />
      </button>
      </div>
    </li>
  );
}
