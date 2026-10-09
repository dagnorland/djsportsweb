# djSports web

The web version of **djSports** — music for sports events, on Spotify.
Same data model, cloud backups and look as the Flutter app
([djsports](https://github.com/dagnorland/djsports)): restore a backup made
in the app and carry on in the browser, or the other way round.

- **Home** — playlists by type (Hotspot, Match, Fun Stuff, Pre-match),
  drag to reorder; welcome screen with cloud restore when empty
- **Playlist & track editors** — sync from a Spotify playlist, search
  Spotify, precise start times with preview
- **Let's Play** — the live board: one click plays a track from its start
  time; auto next, fade pause, keyboard shortcuts
- **djSports player** — this browser tab is its own Spotify Connect
  device "djSports" (Web Playback SDK), with a resizable now-playing panel
- **Cloud Backup** — Firestore backups shared with the app (profile + PIN),
  full restore or sync
- **Settings** — Spotify output, Let's Play, dark/light theme, start-time
  list import/export, playlist sharing

## Run it

```bash
npm install
cp env.example .env.local   # fill in Spotify + Firebase values
npm run dev                 # http://127.0.0.1:3000
```

Open the app on the same host as `NEXTAUTH_URL` (e.g. `127.0.0.1` vs
`localhost`) — the Spotify redirect URI in the Spotify Developer Dashboard
must match: `<NEXTAUTH_URL>/api/auth/callback/spotify`.

Spotify **Premium** is needed for playback. Spotify apps in development
mode only allow registered users — add their Spotify e-mail in the
dashboard.

| Command | |
|---|---|
| `npm run dev` | development server |
| `npm run build` / `npm start` | production build / server |
| `npm test` | unit + contract tests (vitest) |
| `npm run fetch-backup -- "<profile>" <pin>` | save the latest cloud backup to `test/fixtures/flutter-backup.json` (git-ignored) for the contract test |

## Architecture

| Layer | Where | Notes |
|---|---|---|
| Data model | `lib/types/djmodels.ts`, `lib/db/codec.ts` | 1:1 with the Flutter models and JSON. `startTime` is **ms**, `startTimeMS` an extra offset; play position = `startTime + startTimeMS` |
| Local DB | `lib/db/djsports-db.ts` (Dexie / IndexedDB `djsports`) | tables = Flutter Hive boxes: `djplaylist`, `djtrack`, `trackTime`, `settings` |
| Repositories / actions | `lib/db/*-repo.ts`, `playlist-actions.ts`, `library-tools.ts` | ports of the Flutter repos and controllers |
| Cloud backup | `lib/firebase/cloud-backup-service.ts`, `lib/backup/*` | Firestore `backups` collection, same documents as the app |
| Spotify | `lib/spotify/dj-client.ts` (Web API), `web-player.ts` (Web Playback SDK), `playback.ts` (routing + fallback) | |
| UI | `app/*`, `components/{home,playlist,letsplay,settings,stage}` | stage palette in `app/globals.css` / `tailwind.config.ts` |
| Auth | `pages/api/auth/[...nextauth].js` | NextAuth + Spotify OAuth, token refresh |

`docs/FLUTTER_PARITY_PLAN.md` describes how the web app was brought in
line with the Flutter app. `CHANGELOG.md` has the details per release.

## Electron (deprecated)

`main.js` and the `electron*` / `dist` scripts are kept only for
comparison. No new work goes into the Electron build — use the browser
(the djSports player needs no Spotify app).

## Known follow-ups

- Firestore security rules are open (`allow read, write: if true`) —
  tighten after parity
- Apple Music tracks are kept in the data but can't play on the web
