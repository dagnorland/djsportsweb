import { beforeEach, describe, expect, it } from 'vitest';
import { DJSportsDB, getDb, setDbForTests } from '@/lib/db/djsports-db';
import {
  addTracksToPlaylist, createPlaylist, moveTrackInPlaylist, removeTrackFromPlaylist, syncMissingStartTimes,
} from '@/lib/db/playlist-actions';
import type { DJTrack } from '@/lib/types/djmodels';

const t = (id: string, extra: Partial<DJTrack> = {}): DJTrack => ({
  id, name: id, album: '', artist: '', startTime: 0, startTimeMS: 0, duration: 1000, playCount: 0,
  spotifyUri: `spotify:track:${id}`, mp3Uri: '', networkImageUri: '', shortcut: '', appleMusicId: '', ...extra,
});
const form = { name: 'P', type: 'hotspot', spotifyUri: '', appleMusicPlaylistId: '', shuffleAtEnd: false, autoNext: true, position: 0 };

let n = 0;
beforeEach(() => setDbForTests(new DJSportsDB(`actions-${++n}`)));

describe('playlist actions', () => {
  it('adds tracks, skips duplicates, takes start times from the TrackTime library', async () => {
    await getDb().trackTime.put({ id: 'b', startTime: 12000 });
    const p = await createPlaylist(form);
    expect(await addTracksToPlaylist(p.id, [t('a'), t('b'), t('a')])).toEqual({ added: 2, skipped: 1 });
    expect((await getDb().djtrack.get('b'))?.startTime).toBe(12000);
    expect((await getDb().djplaylist.get(p.id))?.trackIds).toEqual(['a', 'b']);
  });

  it('removes a track and deletes it only when no other playlist uses it', async () => {
    const p1 = await createPlaylist(form);
    const p2 = await createPlaylist({ ...form, name: 'Q' });
    await addTracksToPlaylist(p1.id, [t('a'), t('b')]);
    await addTracksToPlaylist(p2.id, [t('a')]);
    await removeTrackFromPlaylist(p1.id, 0);
    await removeTrackFromPlaylist(p1.id, 0);
    expect(await getDb().djtrack.get('a')).toBeDefined();
    expect(await getDb().djtrack.get('b')).toBeUndefined();
  });

  it('moves tracks and fills missing start times', async () => {
    const p = await createPlaylist(form);
    await addTracksToPlaylist(p.id, [t('a'), t('b'), t('c')]);
    await moveTrackInPlaylist(p.id, 0, 2);
    expect((await getDb().djplaylist.get(p.id))?.trackIds).toEqual(['b', 'c', 'a']);
    await getDb().trackTime.put({ id: 'c', startTime: 5000 });
    expect(await syncMissingStartTimes(p.id)).toBe(1);
    expect((await getDb().djtrack.get('c'))?.startTime).toBe(5000);
  });
});
