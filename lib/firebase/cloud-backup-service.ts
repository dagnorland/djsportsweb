/**
 * Firestore cloud backup — same `backups` collection and document format
 * as the Flutter app (cloud_backup_service.dart), so backups move freely
 * between Flutter and web clients.
 */
import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, query,
  serverTimestamp, Timestamp, where,
} from 'firebase/firestore';
import { getFirestoreDb } from './firebase-client';
import type { BackupSummary } from '@/lib/types/djmodels';
import {
  MAX_BACKUPS_PER_DEVICE, buildBackupDocument, parseBackupData, planSync,
  type BackupMeta,
} from '@/lib/backup/backup-core';
import { applySyncPlan, readLocalData, replaceLocalData } from '@/lib/backup/local-store';

const COLLECTION = 'backups';
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

/** Newest first. No orderBy, so no composite index is needed (as Flutter). */
export async function listBackupsForProfile(profileName: string): Promise<BackupSummary[]> {
  if (!profileName) return [];
  const snap = await withTimeout(getDocs(
    query(collection(firestore(), COLLECTION), where('profileName', '==', profileName)),
  ));
  return snap.docs
    .map(d => {
      const x = d.data();
      const ts = x.createdAt instanceof Timestamp ? x.createdAt.toDate() : new Date();
      return {
        id: d.id,
        profileName: x.profileName ?? '',
        spotifyUserId: x.spotifyUserId ?? '',
        spotifyDisplayName: x.spotifyDisplayName ?? '',
        deviceName: x.deviceName ?? '',
        createdAt: ts,
        playlistCount: x.playlistCount ?? 0,
        trackCount: x.trackCount ?? 0,
        tracksWithStartTime: x.tracksWithStartTime ?? 0,
        version: x.version ?? '',
      } satisfies BackupSummary;
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/** Keeps at most 5 backups per device (deletes the oldest first). */
export async function createBackup(meta: BackupMeta): Promise<string> {
  if (!meta.profileName) throw new Error('Set a profile name and 4-digit PIN first');
  const existing = await listBackupsForProfile(meta.profileName);
  const deviceBackups = existing
    .filter(b => b.deviceName === meta.deviceName)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  if (deviceBackups.length >= MAX_BACKUPS_PER_DEVICE) {
    const toDelete = deviceBackups.slice(0, deviceBackups.length - (MAX_BACKUPS_PER_DEVICE - 1));
    for (const old of toDelete) await deleteBackup(old.id);
  }
  const data = await readLocalData();
  const ref = await addDoc(
    collection(firestore(), COLLECTION),
    buildBackupDocument(data, meta, serverTimestamp()),
  );
  return ref.id;
}

async function fetchBackup(backupId: string): Promise<Record<string, unknown>> {
  const snap = await getDoc(doc(firestore(), COLLECTION, backupId));
  if (!snap.exists()) throw new Error(`Backup not found: ${backupId}`);
  return snap.data();
}

/** Full restore — replaces all local data. Returns [playlists, tracks]. */
export async function restoreBackup(backupId: string, onProgress?: Progress): Promise<[number, number]> {
  onProgress?.('Fetching backup from cloud…');
  const data = parseBackupData(await fetchBackup(backupId), onProgress);
  onProgress?.(`Restoring ${data.playlists.length} playlists, ${data.tracks.length} tracks, ` +
    `${data.trackTimes.length} track timings…`);
  await replaceLocalData(data);
  onProgress?.(`Done — ${data.playlists.length} playlists, ${data.tracks.length} tracks.`);
  return [data.playlists.length, data.tracks.length];
}

/** Sync restore — only adds playlists that aren't local yet. */
export async function syncBackup(backupId: string, onProgress?: Progress): Promise<{ added: number; skipped: number }> {
  onProgress?.('Fetching backup from cloud…');
  const backup = parseBackupData(await fetchBackup(backupId), onProgress);
  onProgress?.('Reading local playlists…');
  const plan = planSync(await readLocalData(), backup);
  plan.playlists.forEach(p => onProgress?.(`Adding playlist: ${p.name}…`));
  await applySyncPlan(plan);
  onProgress?.(`Sync done — added ${plan.added} playlist(s), skipped ${plan.skipped}.`);
  return { added: plan.added, skipped: plan.skipped };
}

export async function deleteBackup(backupId: string): Promise<void> {
  await deleteDoc(doc(firestore(), COLLECTION, backupId));
}
