/**
 * Firestore backup service — mirrors Flutter's CloudBackupService.
 * Uses the same `backups` collection and document format so backups are
 * interoperable between the Flutter app and this React web app.
 */

import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { getFirestoreDb } from './firebase-client';
import { getAllPlaylists, clearAllPlaylists } from '@/lib/db/playlist-store';
import { getAllTracks, clearAllTracks } from '@/lib/db/track-store';
import { getAllTrackTimes, clearAllTrackTimes } from '@/lib/db/tracktime-store';
import { getDb } from '@/lib/db/djsports-db';
import type { DJPlaylist, DJTrack, TrackTime, BackupDocument, BackupSummary } from '@/lib/types/djmodels';

const BACKUPS_COLLECTION = 'backups';
const MAX_BACKUPS_PER_DEVICE = 5;

export async function createBackup(
  spotifyUserId: string,
  spotifyDisplayName: string,
  deviceName: string
): Promise<string> {
  const firestoreDb = getFirestoreDb();
  if (!firestoreDb) throw new Error('Firestore not available');

  const playlists = await getAllPlaylists();
  const tracks = await getAllTracks();
  const trackTimes = await getAllTrackTimes();

  const tracksWithStartTime = tracks.filter(t => t.startTimeMS > 0).length;

  // Build the document in Flutter's exact format
  const docData: Omit<BackupDocument, 'createdAt'> & { createdAt: unknown } = {
    spotifyUserId,
    spotifyDisplayName,
    deviceName,
    createdAt: serverTimestamp(),
    version: '1.0',
    playlistCount: playlists.length,
    trackCount: tracks.length,
    tracksWithStartTime,
    playlists,
    tracks,
    trackTimes: trackTimes.map(tt => {
      // Omit startTimeMS when 0 (matches Flutter's conditional toJson)
      if (!tt.startTimeMS || tt.startTimeMS === 0) {
        return { id: tt.id, startTime: tt.startTime };
      }
      return tt;
    }),
  };

  const ref = await addDoc(collection(firestoreDb, BACKUPS_COLLECTION), docData);

  // Enforce max-5 backups per device — delete oldest if exceeded
  await pruneOldBackups(firestoreDb, spotifyUserId, deviceName);

  return ref.id;
}

export async function listBackupsForAccount(spotifyUserId: string): Promise<BackupSummary[]> {
  const firestoreDb = getFirestoreDb();
  if (!firestoreDb) return [];

  const q = query(
    collection(firestoreDb, BACKUPS_COLLECTION),
    where('spotifyUserId', '==', spotifyUserId),
    orderBy('createdAt', 'desc'),
    limit(20)
  );

  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    const createdAt = data.createdAt instanceof Timestamp
      ? data.createdAt.toDate()
      : new Date(data.createdAt ?? 0);
    return {
      id: d.id,
      spotifyUserId: data.spotifyUserId,
      spotifyDisplayName: data.spotifyDisplayName,
      deviceName: data.deviceName,
      createdAt,
      playlistCount: data.playlistCount ?? 0,
      trackCount: data.trackCount ?? 0,
      tracksWithStartTime: data.tracksWithStartTime ?? 0,
      version: data.version ?? '1.0',
    } satisfies BackupSummary;
  });
}

export async function restoreBackup(backupId: string): Promise<void> {
  const firestoreDb = getFirestoreDb();
  if (!firestoreDb) throw new Error('Firestore not available');

  const docRef = doc(firestoreDb, BACKUPS_COLLECTION, backupId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) throw new Error(`Backup ${backupId} not found`);

  const data = snap.data() as BackupDocument;
  const dexieDb = getDb();

  // Clear existing data
  await clearAllPlaylists();
  await clearAllTracks();
  await clearAllTrackTimes();

  // Restore playlists — Flutter uses UUID as id, web app uses Spotify ID.
  // Extract Spotify ID from spotifyUri ("spotify:playlist:XXX" → "XXX") so lookups match.
  if (data.playlists?.length) {
    const playlists = data.playlists.map(p => {
      // spotifyUri can be "spotify:playlist:ID", bare "ID", or "ID?si=...&pi=..."
      const rawId = p.spotifyUri?.split(':').pop()?.split('?')[0]?.trim();
      const id = rawId && rawId.length > 10 ? rawId : p.id;
      return { ...p, id, trackIds: p.trackIds ?? [] };
    });
    await dexieDb.playlists.bulkPut(playlists);
  }

  // Restore tracks
  if (data.tracks?.length) {
    const tracks: DJTrack[] = data.tracks.map(t => {
      // Flutter stores startTime in ms; startTimeMS is the same value (or absent)
      const startTimeMS = t.startTimeMS || t.startTime || 0;
      return {
        ...t,
        startTimeMS,
        startTime: Math.floor(startTimeMS / 1000),
        mp3Uri: t.mp3Uri ?? '',
        shortcut: t.shortcut ?? '',
      };
    });
    await dexieDb.tracks.bulkPut(tracks);
  }

  // Restore track times
  if (data.trackTimes?.length) {
    const trackTimes: TrackTime[] = data.trackTimes.map(tt => {
      const startTimeMS = tt.startTimeMS || tt.startTime || 0;
      return {
        id: tt.id,
        startTime: Math.floor(startTimeMS / 1000),
        ...(startTimeMS > 0 ? { startTimeMS } : {}),
      };
    });
    await dexieDb.trackTimes.bulkPut(trackTimes);
  }

}

export async function deleteBackup(backupId: string): Promise<void> {
  const firestoreDb = getFirestoreDb();
  if (!firestoreDb) throw new Error('Firestore not available');

  await deleteDoc(doc(firestoreDb, BACKUPS_COLLECTION, backupId));
}

async function pruneOldBackups(
  firestoreDb: ReturnType<typeof getFirestoreDb>,
  spotifyUserId: string,
  deviceName: string
): Promise<void> {
  if (!firestoreDb) return;

  // Query only by userId (no composite index needed), filter by deviceName client-side
  const q = query(
    collection(firestoreDb, BACKUPS_COLLECTION),
    where('spotifyUserId', '==', spotifyUserId),
    orderBy('createdAt', 'desc')
  );

  const snap = await getDocs(q);
  const deviceDocs = snap.docs.filter(d => d.data().deviceName === deviceName);
  if (deviceDocs.length > MAX_BACKUPS_PER_DEVICE) {
    const toDelete = deviceDocs.slice(MAX_BACKUPS_PER_DEVICE);
    await Promise.all(toDelete.map(d => deleteDoc(d.ref)));
  }
}
