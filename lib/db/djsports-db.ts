/**
 * Dexie (IndexedDB) database for djSports web — equivalent to Flutter's Hive local DB.
 * SSR-safe: only instantiated in browser context.
 */

import Dexie, { type Table } from 'dexie';
import type { DJPlaylist, DJTrack, TrackTime } from '@/lib/types/djmodels';

// Legacy holding tables for migration from localStorage
export interface LegacyStartTime {
  id: string;          // track ID
  startTimeMS: number;
}

export interface LegacyPlaylistType {
  id: string;          // playlist ID
  type: string;
}

export interface DbMeta {
  key: string;
  value: string;
}

class DJSportsDB extends Dexie {
  playlists!: Table<DJPlaylist, string>;
  tracks!: Table<DJTrack, string>;
  trackTimes!: Table<TrackTime, string>;
  legacyStartTimes!: Table<LegacyStartTime, string>;
  legacyPlaylistTypes!: Table<LegacyPlaylistType, string>;
  meta!: Table<DbMeta, string>;

  constructor() {
    super('DJSportsDB');

    this.version(1).stores({
      playlists: 'id, name, type, position',
      tracks: 'id, name, startTimeMS',
      trackTimes: 'id, startTime',
      legacyStartTimes: 'id',
      legacyPlaylistTypes: 'id',
      meta: 'key',
    }).upgrade(tx => {
      // Migrate existing localStorage data into holding tables on first run
      if (typeof window === 'undefined') return;

      try {
        const rawStartTimes = window.localStorage.getItem('trackStartTimes');
        if (rawStartTimes) {
          const map: Record<string, number> = JSON.parse(rawStartTimes);
          const records: LegacyStartTime[] = Object.entries(map).map(([id, startTimeMS]) => ({ id, startTimeMS }));
          if (records.length > 0) {
            tx.table('legacyStartTimes').bulkAdd(records);
          }
        }
      } catch (_) { /* ignore */ }

      try {
        const rawTypes = window.localStorage.getItem('playlistTypes');
        if (rawTypes) {
          const map: Record<string, string> = JSON.parse(rawTypes);
          const records: LegacyPlaylistType[] = Object.entries(map).map(([id, type]) => ({ id, type }));
          if (records.length > 0) {
            tx.table('legacyPlaylistTypes').bulkAdd(records);
          }
        }
      } catch (_) { /* ignore */ }
    });
  }
}

let _db: DJSportsDB | null = null;

export function getDb(): DJSportsDB {
  if (typeof window === 'undefined') {
    throw new Error('DJSportsDB cannot be used on the server');
  }
  if (!_db) {
    _db = new DJSportsDB();
  }
  return _db;
}

export type { DJSportsDB };
