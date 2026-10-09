/**
 * Contract test: a real Flutter cloud backup must survive
 * restore → (web) → backup unchanged, so Flutter can restore it again.
 * Fixture: test/fixtures/flutter-backup.json (scripts/fetch-backup.mjs).
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { DJSportsDB, setDbForTests } from '@/lib/db/djsports-db';
import { buildBackupDocument, parseBackupData, planSync } from '@/lib/backup/backup-core';
import { readLocalData, replaceLocalData, applySyncPlan } from '@/lib/backup/local-store';
import { startPositionMs } from '@/lib/types/djmodels';
import {
  getDJPlaylistBySpotifyId, reorderPlaylistsOfType, removeDJPlaylist,
} from '@/lib/db/playlist-repo';
import { getDJTrack, setTrackStartTime } from '@/lib/db/track-repo';

const FIXTURE = path.join(__dirname, 'fixtures/flutter-backup.json');
const hasFixture = existsSync(FIXTURE);
const raw = hasFixture ? JSON.parse(readFileSync(FIXTURE, 'utf8')) : {};

const byId = <T extends { id: string }>(xs: T[]) =>
  Object.fromEntries(xs.map(x => [x.id, x]));

let n = 0;
beforeEach(async () => {
  setDbForTests(new DJSportsDB(`test-${++n}`));
});

describe.skipIf(!hasFixture)('Flutter backup contract', () => {
  it('parses every playlist, track and track time', () => {
    const d = parseBackupData(raw);
    expect(d.playlists).toHaveLength(raw.playlists.length);
    expect(d.tracks).toHaveLength(raw.tracks.length);
    expect(d.trackTimes).toHaveLength(raw.trackTimes.length);
    expect(raw.playlistCount).toBe(d.playlists.length);
    expect(raw.trackCount).toBe(d.tracks.length);
  });

  it('round-trips restore → backup with identical data', async () => {
    await replaceLocalData(parseBackupData(raw));
    const local = await readLocalData();
    const doc = buildBackupDocument(local, {
      profileName: 'x|0000',
      spotifyUserId: raw.spotifyUserId,
      spotifyDisplayName: raw.spotifyDisplayName,
      deviceName: raw.deviceName,
    }, null);

    expect(doc.version).toBe(raw.version);
    expect(doc.playlistCount).toBe(raw.playlistCount);
    expect(doc.trackCount).toBe(raw.trackCount);
    expect(doc.tracksWithStartTime).toBe(raw.tracksWithStartTime);
    expect(byId(doc.playlists)).toEqual(byId(raw.playlists));
    expect(byId(doc.tracks)).toEqual(byId(raw.tracks));
    expect(byId(doc.trackTimes)).toEqual(byId(raw.trackTimes));
  });

  it('keeps Flutter ids and start times in milliseconds', async () => {
    await replaceLocalData(parseBackupData(raw));
    const local = await readLocalData();
    for (const p of local.playlists) expect(p.id).toMatch(/^[0-9a-f-]{36}$/);
    const src = raw.tracks.find((t: { startTimeMS: number }) => t.startTimeMS > 0);
    const t = local.tracks.find(x => x.id === src.id)!;
    expect(startPositionMs(t)).toBe(src.startTime + src.startTimeMS);
  });

  it('sync adds only missing playlists and their tracks', async () => {
    const backup = parseBackupData(raw);
    const [keep, ...rest] = backup.playlists;
    const keepTracks = backup.tracks.filter(t => keep.trackIds.includes(t.id));
    await replaceLocalData({ playlists: [keep], tracks: keepTracks, trackTimes: [] });

    const plan = planSync(await readLocalData(), backup);
    expect(plan.skipped).toBe(1);
    expect(plan.added).toBe(rest.length);
    await applySyncPlan(plan);

    const after = await readLocalData();
    expect(after.playlists).toHaveLength(backup.playlists.length);
    const needed = new Set(backup.playlists.flatMap(p => p.trackIds));
    expect(new Set(after.tracks.map(t => t.id))).toEqual(needed);
  });

  it('repository helpers behave like Flutter', async () => {
    await replaceLocalData(parseBackupData(raw));
    const first = raw.playlists[0];
    expect((await getDJPlaylistBySpotifyId(`spotify:playlist:${first.spotifyUri}`))?.id).toBe(first.id);

    const type = first.type;
    await reorderPlaylistsOfType(type, 0, 2);
    const ordered = (await readLocalData()).playlists
      .filter(p => p.type === type).sort((a, b) => a.position - b.position);
    expect(ordered.map(p => p.position)).toEqual(ordered.map((_, i) => i));

    const tid = first.trackIds[0];
    await setTrackStartTime(tid, 12000, 300);
    expect(startPositionMs((await getDJTrack(tid))!)).toBe(12300);

    await removeDJPlaylist(first.id);
    const after = await readLocalData();
    const used = new Set(after.playlists.flatMap(p => p.trackIds));
    const orphans = first.trackIds.filter((id: string) => !used.has(id));
    for (const id of orphans) expect(after.tracks.find(t => t.id === id)).toBeUndefined();
  });
});

import { spotifyIdFromUri } from '@/lib/db/codec';
import { normalizeSpotifyUri } from '@/lib/db/playlist-actions';

describe('Spotify uri helpers', () => {
  it('extracts the playlist id from every form Flutter stores', () => {
    for (const u of [
      '7mpOe1Luw2gNjG7x8EgeLJ',
      'spotify:playlist:7mpOe1Luw2gNjG7x8EgeLJ',
      'playlist/7mpOe1Luw2gNjG7x8EgeLJ',
      'playlist:7mpOe1Luw2gNjG7x8EgeLJ',
      '7mpOe1Luw2gNjG7x8EgeLJ?si=43ea45edc7074725',
      'https://open.spotify.com/playlist/7mpOe1Luw2gNjG7x8EgeLJ?si=abc',
    ]) expect(spotifyIdFromUri(u)).toBe('7mpOe1Luw2gNjG7x8EgeLJ');
  });
  it('normalizes pasted links like Flutter', () => {
    expect(normalizeSpotifyUri('https://open.spotify.com/playlist/7mpOe1Luw2gNjG7x8EgeLJ?si=x')).toBe('7mpOe1Luw2gNjG7x8EgeLJ');
    expect(normalizeSpotifyUri('spotify:playlist:abc')).toBe('spotify:playlist:abc');
  });
});
