/**
 * Firestore cloud backup — shared with the Flutter app.
 *
 * Location (since the security update, docs/FIRESTORE_SECURITY_PLAN.md):
 *   profiles/{profileStorageKey(Profile + PIN)}/backups/{id}
 * Only someone who knows Profile + PIN can find, read or delete them; the
 * PIN is not stored. During the transition, backups still in the old
 * top-level `backups` collection are listed read-only ("legacy") so they
 * can be restored until the migration script has moved them.
 */
import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, query,
  serverTimestamp, Timestamp, where, type DocumentData,
} from 'firebase/firestore';
import { getFirestoreDb } from './firebase-client';
import type { BackupSummary } from '@/lib/types/djmodels';
import {
  MAX_BACKUPS_PER_DEVICE, buildBackupDocument, parseBackupData, planSync,
  type BackupMeta,
} from '@/lib/backup/backup-core';
import { applySyncPlan, readLocalData, replaceLocalData } from '@/lib/backup/local-store';
import { profileStorageKey } from '@/lib/backup/profile-key';
import { notifyDataChanged } from '@/lib/db/events';

const LEGACY_COLLECTION = 'backups';
const LEGACY_PREFIX = 'legacy:';
const TIMEOUT_MS = 15_000;

type Progress = (message: string) => void;

function firestore() {
  const db = getFirestoreDb();
  if (!db) throw new Error('Firestore not available — check NEXT_PUBLIC_FIREBASE_* settings');
  return db;
}

function withTimeout<T>(p: Promise<T>): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(
      'Firestore timed out — check that Firestore Database is enabled ' +
      'in your Firebase project and security rules allow read/write.',
    )), TIMEOUT_MS)),
  ]);
}

async function backupsCollection(profileName: string) {
  return collection(firestore(), 'profiles', await profileStorageKey(profileName), 'backups');
}

function toSummary(id: string, x: DocumentData, profileName: string): BackupSummary {
  return {
    id,
    profileName,
    spotifyUserId: x.spotifyUserId ?? '',
    spotifyDisplayName: x.spotifyDisplayName ?? '',
    deviceName: x.deviceName ?? '',
    createdAt: x.createdAt instanceof Timestamp ? x.createdAt.toDate() : new Date(),
    playlistCount: x.playlistCount ?? 0,
    trackCount: x.trackCount ?? 0,
    tracksWithStartTime: x.tracksWithStartTime ?? 0,
    version: x.version ?? '',
  };
}

export const isLegacyBackup = (b: Pick<BackupSummary, 'id'>) => b.id.startsWith(LEGACY_PREFIX);

/** Newest first. Includes not-yet-migrated backups (read-only) while the old collection is readable. */
export async function listBackupsForProfile(profileName: string): Promise<BackupSummary[]> {
  if (!profileName) return [];
  const snap = await withTimeout(getDocs(await backupsCollection(profileName)));
  const result = snap.docs.map(d => toSummary(d.id, d.data(), profileName));
  try {
    const legacy = await withTimeout(getDocs(query(collection(firestore(), LEGACY_COLLECTION), where('profileName', '==', profileName))));
    result.push(...legacy.docs.map(d => toSummary(LEGACY_PREFIX + d.id, d.data(), profileName)));
  } catch {
    // Locked by the new rules (after migration) — expected.
  }
  return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/** Keeps at most 5 backups per device (deletes the oldest first). */
export async function createBackup(meta: BackupMeta): Promise<string> {
  if (!meta.profileName) throw new Error('Set a profile name and 4-digit PIN first');
  const existing = (await listBackupsForProfile(meta.profileName)).filter(b => !isLegacyBackup(b));
  const deviceBackups = existing
    .filter(b => b.deviceName === meta.deviceName)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  if (deviceBackups.length >= MAX_BACKUPS_PER_DEVICE) {
    const toDelete = deviceBackups.slice(0, deviceBackups.length - (MAX_BACKUPS_PER_DEVICE - 1));
    for (const old of toDelete) await deleteBackup(meta.profileName, old.id);
  }
  const data = await readLocalData();
  // The profile name / PIN are not stored in the document.
  const { profileName: _omit, ...docData } = buildBackupDocument(data, meta, serverTimestamp());
  void _omit;
  const ref = await addDoc(await backupsCollection(meta.profileName), docData);
  return ref.id;
}

async function backupRef(profileName: string, backupId: string) {
  return isLegacyBackup({ id: backupId })
    ? doc(firestore(), LEGACY_COLLECTION, backupId.slice(LEGACY_PREFIX.length))
    : doc(await backupsCollection(profileName), backupId);
}

async function fetchBackup(profileName: string, backupId: string): Promise<Record<string, unknown>> {
  const snap = await getDoc(await backupRef(profileName, backupId));
  if (!snap.exists()) throw new Error(`Backup not found: ${backupId}`);
  return snap.data();
}

/** Full restore — replaces all local data. Returns [playlists, tracks]. */
export async function restoreBackup(profileName: string, backupId: string, onProgress?: Progress): Promise<[number, number]> {
  onProgress?.('Fetching backup from cloud…');
  const data = parseBackupData(await fetchBackup(profileName, backupId), onProgress);
  onProgress?.(`Restoring ${data.playlists.length} playlists, ${data.tracks.length} tracks, ` +
    `${data.trackTimes.length} track timings…`);
  await replaceLocalData(data);
  notifyDataChanged();
  onProgress?.(`Done — ${data.playlists.length} playlists, ${data.tracks.length} tracks.`);
  return [data.playlists.length, data.tracks.length];
}

/** Sync restore — only adds playlists that aren't local yet. */
export async function syncBackup(profileName: string, backupId: string, onProgress?: Progress): Promise<{ added: number; skipped: number }> {
  onProgress?.('Fetching backup from cloud…');
  const backup = parseBackupData(await fetchBackup(profileName, backupId), onProgress);
  onProgress?.('Reading local playlists…');
  const plan = planSync(await readLocalData(), backup);
  plan.playlists.forEach(p => onProgress?.(`Adding playlist: ${p.name}…`));
  await applySyncPlan(plan);
  notifyDataChanged();
  onProgress?.(`Sync done — added ${plan.added} playlist(s), skipped ${plan.skipped}.`);
  return { added: plan.added, skipped: plan.skipped };
}

export async function deleteBackup(profileName: string, backupId: string): Promise<void> {
  await deleteDoc(await backupRef(profileName, backupId));
}
