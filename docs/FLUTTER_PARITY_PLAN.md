# djsportsweb → Flutter parity plan

Branch: `feature/flutter-parity`
Reference app: `djsports` (Flutter) 4.1.2
Goal: same data model, interoperable cloud backup/restore, and the same
dark "stage" look and flow (Home → Let's Play → Cloud Backup) as the
Flutter app.

## Decisions (2026-10-09)

- **Data model:** use the Flutter model as-is. **No migration** — the
  current web Dexie DB, `lib/db/migration.ts`, `MigrationRunner.tsx` and the
  localStorage legacy tables are deleted. New DB name (`djsports`) so old
  browser data is simply ignored (old `DJSportsDB` deleted on startup)
- **Starting data for web clients:** restore a Flutter cloud backup
  (Profile + PIN → Restore). No need to rebuild data from Spotify
- **Electron:** kept for comparison, marked **deprecated** (no new work)
- **Firestore security:** after parity
- **Themes:** dark stage look by default, light theme as an option

---

## 0. Where we are today

PR #20 already added Dexie (`lib/db/*`), `lib/types/djmodels.ts` and a
Firestore backup service. But the web app still treats **Spotify
playlists as the source of truth** and Dexie as a cache with a DJ type
attached. Flutter is the other way round: **DJ playlists are local
entities**, a Spotify playlist is only a link you sync from.

### Gaps found (concrete)

| Area | Flutter (truth) | Web today | Effect |
|---|---|---|---|
| `DJTrack.startTime` | **milliseconds** (`Duration(milliseconds: startTime)`) | seconds (`floor(ms/1000)`) | Web backups load in Flutter with the wrong start position |
| `DJTrack.startTimeMS` | extra ms offset, usually `0`; playback position = `startTime + startTimeMS` | full start position in ms | Same as above, double-counting |
| `TrackTime.startTime` | ms | seconds | Same |
| `DJPlaylist.id` | UUID | Spotify playlist id; restore **rewrites** ids from `spotifyUri` | IDs change on each round-trip; duplicates in Flutter sync |
| `appleMusicPlaylistId`, `appleMusicId` | present | missing | Web drops them on restore → backup → Flutter loses Apple Music links |
| Backup key | `profileName = "Name|1234"` (name + 4-digit PIN) | `spotifyUserId` | Flutter and web can't see each other's backups |
| Backup list query | `where(profileName)` only, sort client-side | `where + orderBy(createdAt)` | Web needs a composite index Flutter avoids |
| Prune | delete oldest **before** add, max 5 per device | after add | Minor, but align |
| Sync restore | adds missing playlists (match on `spotifyUri` / `appleMusicPlaylistId`) + their tracks/timings | missing | — |
| Playlist type `'none'` | doesn't exist | used for un-typed Spotify playlists | Pollutes backups |
| Settings (`settings` Hive box) | device name, backup profile/PIN, fade ms, keyboard, info popups, preferred device | partly in localStorage | Move to Dexie `meta` |
| Look | dark stage palette, Spotify-style shelves | shadcn purple/yellow themes | — |

---

## 1. Data model parity (foundation — do first)

1. **`lib/types/djmodels.ts`** — mirror the Dart models 1:1
   - `DJPlaylist`: add `appleMusicPlaylistId: string` (default `''`)
   - `DJTrack`: add `appleMusicId: string` (default `''`); fix comments:
     `startTime` = ms, `startTimeMS` = extra ms offset
   - `TrackTime`: `startTime` = ms, `startTimeMS?` omitted when null
   - `DJPlaylistType` = `'hotspot' | 'match' | 'funStuff' | 'preMatch' | 'archived'`
     (Dart enum `.name`); drop `'none'`. Keep `typeLabel()` →
     `'hotspot' | 'match' | 'fun stuff' | 'pre match' | 'archived'`
   - Helper `startPositionMs(track) = track.startTime + track.startTimeMS`
     — use it **everywhere** playback seeks
2. **New Dexie DB, no migration** (`djsports-db.ts` rewritten)
   - DB name `djsports`, version 1; on startup `Dexie.delete('DJSportsDB')`
   - Tables = Hive boxes: `djplaylist`, `djtrack`, `trackTime`,
     `settings` (key/value), `lastPlayed`
   - Indexes: `djplaylist: 'id, type, position, spotifyUri, appleMusicPlaylistId'`
   - Delete `migration.ts`, `MigrationRunner.tsx`, legacy tables,
     `lib/utils/trackStartTimes.ts` / `playlistTypes.ts` localStorage paths
3. **Repositories** (`lib/db/*-store.ts`) mirror `djplaylist_repository`,
   `djtrack_repository`, `track_time_repository`: `getAll / add / update /
   delete / deleteAll`, `reorderPlaylistsOfType(type, old, new)`,
   `removePlaylist(id)` (also removes orphan tracks like Flutter)
4. **Spotify becomes an import source** — remove
   `upsertPlaylistFromSpotify` auto-mirroring. New
   `syncPlaylistFromSpotify(djPlaylist)` = Flutter's
   `spotify_playlist_sync_delegate`: fetch tracks for `spotifyUri`, upsert
   `DJTrack` (Spotify track id as id, like `DJTrack.fromSpotifyTrack`),
   keep existing start times, set `trackIds` order
5. **Tests** (add vitest): take a real Flutter backup JSON as a fixture →
   restore → backup → deep-equal (ignoring `createdAt`). This is the
   contract test for everything else.

## 2. Cloud backup / restore parity

Port `cloud_backup_service.dart` + `backup_profile_provider.dart` exactly.

- **Profile**: name + 4-digit PIN in `settings` (`backupProfile`,
  `backupPin`); lookup key `"${name}|${pin}"`, `''` if incomplete
- **Create**: same document as Flutter —
  `profileName, spotifyUserId, spotifyDisplayName, deviceName,
  createdAt (serverTimestamp), version '1.0', playlistCount, trackCount,
  tracksWithStartTime (startTime>0 || startTimeMS>0), playlists, tracks,
  trackTimes`. Prune first: keep max 5 per `deviceName` (delete oldest)
- **List**: `where('profileName','==',key)`, 15 s timeout, sort desc
  client-side, no `orderBy`/`limit`
- **Restore (full)**: clear all → add playlists as-is (no id rewrite) →
  tracks with null guards (as in Dart) → track times; progress callback
- **Sync restore**: add only playlists not already local (match on
  non-empty `spotifyUri` or `appleMusicPlaylistId`) + their missing
  tracks and timings
- **Delete** backup
- **UI** `/backup` page in stage look, sections like
  `cloud_backup_screen.dart`: *Profile* (name + PIN), *Device name*,
  *Backup* (Back up now + counts), *Existing backups* (tiles: device,
  date, playlists/tracks/with start time; actions Restore / Sync /
  Delete with confirm dialogs; progress log)
- Replace `FirestoreBackupPanel.tsx` with this page
- Empty-state / first-time screen gets a prominent **"Restore from
  cloud backup"** path — that's how a new web client gets its data
- ⚠️ (Later, after parity) `firestore.rules` is `allow read, write: if true`. Not a parity
  issue, but anyone with the project config can read/delete all backups.
  Follow-up: Firebase anonymous auth + rules, or a hashed profile key.

## 3. Visual look (stage theme)

- Tailwind tokens from `stage_colors.dart`:
  `background #121212`, `surface #1E1E1E`, `panel #181818`,
  `surfaceHigh #2A2A2A`, `divider #2E2E2E`, `text #FFFFFF`,
  `textMuted #B3B3B3`; inputs: border `white/38`, focus white 2 px, radius 8
- Type colours: hotspot `red`, match `green`, funStuff `blue`,
  preMatch `black` → `grey-400` on dark, archived `greenAccent`.
  Single source: `lib/theme/playlistTypes.ts`
- **Dark stage is the default** everywhere; **light theme as an option**
  (Settings toggle, stored in `settings`). Replace the purple/yellow theme
  switcher with dark/light, both defined as CSS variables
- Shared components: `StageAppBar`, `SectionHeader`, `TypeBadge`,
  `CoverMosaic`, `RoundPlayButton`, `ExitButton`, toast (= `app_toast`)

## 4. Home page

Port `djsports_home_page.dart` + `widgets/playlist_browser.dart` +
`widgets/playlist_card.dart`.

- **App bar**: version (left on wide), title `djsports`, Spotify
  `account → device` chip (opens output sheet), Let's Play logo button
  (flashing logo), ⋮ menu: *Let's Play* (green), *New playlist*,
  *Settings*, *Cloud Backup*, *Playlist Help*
- **No playlists** → `FirstTimeUseScreen`: welcome, Spotify connect,
  playlist types, how to add, device name, example setups
  (`playlist_examples_dropdown`)
- **Playlist browser**: type chips (All + each type). *All* = one
  horizontal shelf per type, two shelves side by side when both fit;
  single type = grid of bigger cards; drag-reorder within a shelf writes
  `position` (use `@dnd-kit`)
- **Playlist card**: square cover (2×2 mosaic of first four distinct
  covers), round edit button in type colour, ⋮ menu (edit / delete),
  name (2 lines) + "N tracks · M with start time"
- **Playlist editor** (`djplaylist_edit_create.dart`): name, type,
  Spotify URI, autoNext, shuffleAtEnd, *Sync from Spotify*, *Search
  Spotify* to add tracks, track list with start times, delete/reorder
- **Track editor** (`djtrack_edit_create.dart`): start-time slider +
  min/sec picker, preview play from start, prev/next track cards on wide
  screens

## 5. Let's Play (replaces `/match`)

Port `djletsplay.dart` + `widgets/letsplay_playlist_card.dart`.

- Route `/letsplay` (redirect `/match`)
- Board: one section per type in home order; every section gets
  `maxPerSection` columns so tiles align
- Card: cover with round play button in type colour, current track
  title (shrink font / ellipsis, never break mid-word), `<` `>` browse
  without playing, tap = play current track at `startPositionMs`, flash
  to confirm, advance `currentTrack`, increment `playCount`;
  `shuffleAtEnd` when wrapping
- Auto Next per playlist setting
- Controls: sidebar on wide screens, bottom bar otherwise — play, pause,
  **fade pause** (fade ms from settings), volume ±, Exit (✕ ring + "EXIT")
- Keyboard (toggle in settings): Hotspot `1–6`, Match `Q–Y`, Fun `A–H`,
  `P` play, `Esc` pause, `+/-` volume
- Now-playing panel (`web_player_panel.dart`) and info pop-ups toggle
- Playback via Spotify Web API on the chosen Connect device; port the
  "follow Spotify device by default, *Set device* / *Clear*" logic from
  4.1.0 (`spotifyPreferredDeviceId/Name` in settings). Keep existing
  `trackPlayer.ts` optimisations

## 6. Settings & help

`settings_center_screen.dart` tabs: *Let's Play settings* (keyboard,
info pop-ups, fade), *Start time* (import/export track-time JSON
`[{"id","startTime"}]`, delete zero start times), *Playlists*,
*Spotify diagnostics*. Help pages: Playlist Help, Let's Play Help.
Apple Music: **not in web scope** (MusicKit JS later) — only preserve
the fields.

## 7. Cleanup & release

- Electron: keep `main.js` / electron-builder, mark deprecated in README
  and `package.json` scripts; no new features. Remove unused
  `lib/spotify/*` endpoints (audiobooks, shows, …)
- Rewrite README (still the template), update `USER_GUIDE.md` /
  `BRUKERVEILEDNING.md`, CHANGELOG in Keep-a-Changelog format like Flutter
- Version `1.0.0` when backups round-trip with Flutter

---

## Suggested order / PRs

1. Data model + new Dexie DB (old one ditched) + contract test (§1)
2. Cloud backup page + service (§2) — **interop milestone**: Flutter
   backup → web restore → web backup → Flutter restore, start times intact
3. Stage theme + shared components (§3)
4. Home page + playlist/track editors (§4)
5. Let's Play (§5)
6. Settings, help, cleanup (§6–7)
