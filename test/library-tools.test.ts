import { beforeEach, describe, expect, it } from 'vitest';
import { DJSportsDB, getDb, setDbForTests } from '@/lib/db/djsports-db';
import {
  addMissingFromTracks, applyListToTracksWithoutStartTime, deleteTrackTimes, exportPlaylistsJson,
  exportTrackTimesJson, importPlaylistsJson, importTrackTimesJson,
} from '@/lib/db/library-tools';
import type { DJTrack } from '@/lib/types/djmodels';

const t = (id: string, startTime = 0): DJTrack => ({
  id, name: id, album: '', artist: '', startTime, startTimeMS: 0, duration: 1000, playCount: 0,
  spotifyUri: `spotify:track:${id}`, mp3Uri: '', networkImageUri: '', shortcut: '', appleMusicId: '',
});
let n = 0;
beforeEach(() => setDbForTests(new DJSportsDB(`tools-${++n}`)));

describe('start-time list', () => {
  it('fills from tracks, exports, imports and applies like Flutter', async () => {
    await getDb().djtrack.bulkPut([t('a', 11000), t('b'), t('c')]);
    expect(await addMissingFromTracks()).toEqual({ added: 1, total: 1 });
    expect(JSON.parse((await exportTrackTimesJson()).json)).toEqual([{ id: 'a', startTime: 11000, startTimeMS: 0 }]);
    expect(await importTrackTimesJson('[{"id":"b","startTime":36000},{"id":"a","startTime":1}]')).toBe(1);
    expect(await applyListToTracksWithoutStartTime()).toBe(1);
    expect((await getDb().djtrack.get('b'))?.startTime).toBe(36000);
    await getDb().trackTime.put({ id: 'z', startTime: 0 });
    expect(await deleteTrackTimes(true)).toBe(1);
    await expect(importTrackTimesJson('{"id":"x"}')).rejects.toThrow('JSON must be a list.');
  });
});

describe('playlist sharing', () => {
  it('round-trips the playlist JSON and skips existing URIs', async () => {
    expect(await importPlaylistsJson('[{"playlistUri":"abc","playlistType":"match","name":"M"},{"playlistUri":"abc"}]'))
      .toEqual({ added: 1, skipped: 1 });
    expect(JSON.parse((await exportPlaylistsJson()).json)).toEqual([{ playlistUri: 'abc', playlistType: 'match', name: 'M' }]);
  });
});
