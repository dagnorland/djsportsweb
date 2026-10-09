/**
 * Local database — the web equivalent of the Flutter app's Hive boxes
 * (main.dart): `djplaylist`, `djtrack`, `trackTime`, `settings`.
 *
 * No migration from the old web DB (`DJSportsDB`): it is deleted on first
 * start. New clients get their data by restoring a cloud backup.
 */
import Dexie, { type Table } from 'dexie';
import type { DJPlaylist, DJTrack, TrackTime } from '@/lib/types/djmodels';

export const DB_NAME = 'djsports';
const OLD_DB_NAMES = ['DJSportsDB'];

export interface SettingRow {
  key: string;
  value: unknown;
}

export class DJSportsDB extends Dexie {
  djplaylist!: Table<DJPlaylist, string>;
  djtrack!: Table<DJTrack, string>;
  trackTime!: Table<TrackTime, string>;
  settings!: Table<SettingRow, string>;

  constructor(name = DB_NAME) {
    super(name);
    this.version(1).stores({
      djplaylist: 'id, type, position, spotifyUri, appleMusicPlaylistId',
      djtrack: 'id, spotifyUri, appleMusicId',
      trackTime: 'id',
      settings: 'key',
    });
  }
}

let _db: DJSportsDB | null = null;
let _oldDeleted = false;

export function getDb(): DJSportsDB {
  if (typeof indexedDB === 'undefined') {
    throw new Error('djsports DB is only available in the browser');
  }
  if (!_db) {
    _db = new DJSportsDB();
    if (!_oldDeleted) {
      _oldDeleted = true;
      for (const n of OLD_DB_NAMES) {
        Dexie.delete(n).catch(() => { /* ignore */ });
      }
    }
  }
  return _db;
}

/** Tests only: use a separate DB instance. */
export function setDbForTests(db: DJSportsDB | null): void {
  _db = db;
  _oldDeleted = true;
}
