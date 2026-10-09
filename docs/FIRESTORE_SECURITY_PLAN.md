# Firestore security plan (djsports app + djsportsweb)

> **Decision 2026-10-09 (Dag Børre):** Profile + PIN key path, locked
> rules and migration in both apps; **App Check later**; no anonymous
> auth for now (rules check the key format; knowing the key is the access
> right). Implemented: djsportsweb (this branch) and djsports
> `feature/secure-backups`.
>
> ## Rollout checklist
> 1. Release djsports (`flutter pub get`, `flutter test`) and deploy
>    djsportsweb. Both read the new path and still list old backups
>    read-only (marked "OLD").
> 2. In djsportsweb, with the OLD open rules still live:
>    `npm run migrate-backups` (dry run) → `npm run migrate-backups -- --copy`
>    → check both apps see the backups → `npm run migrate-backups -- --copy --delete-old`.
> 3. In djsports: `firebase deploy --only firestore:rules`.
> 4. Later: App Check; drop the old-collection fallback in both apps.


Project `djsportscloud`. Today `firestore.rules` is

```
match /{document=**} { allow read, write: if true; }
```

and both apps use one top-level collection `backups`, found with
`where('profileName', '==', 'Name|1234')`. Anyone with the (public) web
config can list, read, overwrite or delete **every** backup — including
other users' profile names and PINs, which are stored in clear text.

## Goal
Only someone who knows *Profile + PIN* can see or change those backups;
nobody can list other profiles; no clear-text PINs in the database; old
backups keep working through a migration; both apps change together.

## Recommended design: secret-derived path + anonymous auth + App Check

1. **Profile key = hash, not text.**
   `key = SHA-256("djsports:v1:" + profileName.trim().toLowerCase() + "|" + pin)` (hex).
   Same function in Dart (`package:crypto`) and TS (Web Crypto).
2. **New location:** `profiles/{key}/backups/{backupId}` — same document
   fields as today, but **without** `profileName` (or only the name, never
   the PIN). Listing = reading that sub-collection; no query on a shared
   collection, no composite index.
3. **Firebase Anonymous Auth** in both apps (`firebase_auth` /
   `firebase/auth`) so rules can require `request.auth != null`, plus
   **App Check** (App Attest / DeviceCheck on iOS-macOS, Play Integrity on
   Android, reCAPTCHA Enterprise on web) so only the real apps can call
   Firestore — scripts with the copied config are blocked and brute-forcing
   PINs gets impractical.
4. **Rules**

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{db}/documents {
       // Knowing the key (= profile + PIN) is the access right.
       match /profiles/{key}/backups/{backupId} {
         allow read, delete: if request.auth != null && key.size() == 64;
         allow create: if request.auth != null && key.size() == 64
           && request.resource.data.keys().hasAll(
                ['deviceName','createdAt','version','playlists','tracks','trackTimes'])
           && request.resource.data.version is string
           && request.resource.data.createdAt == request.time;
         allow update: if false;            // backups are immutable
       }
       // No listing of profiles, nothing else.
       match /{document=**} { allow read, write: if false; }
     }
   }
   ```
   (Document size is capped by Firestore at 1 MiB; today's largest backup is ~270 KB.)
5. **Migration of existing backups** (one-off script with the Admin SDK,
   run by Dag Børre): for every doc in `backups`, compute the key from its
   `profileName`, copy to `profiles/{key}/backups/{sameId}` without the
   PIN, then delete the old doc. Run it right before the new rules go live.
6. **Rollout order**
   1. Ship both apps with: new path for read + write, anonymous sign-in,
      App Check in *monitor* mode; read the old `backups` path as fallback.
   2. Run the migration script. Deploy the new rules. Enforce App Check.
   3. Next release: remove the fallback.
   Old app versions that are not updated stop seeing backups after step 2 —
   acceptable for a small user base; announce it in the release notes.

## Alternatives considered
- **Real accounts (Sign in with Apple/Google, owner = uid):** strongest,
  but a new login step in both apps and no more "same Profile + PIN on
  every device" sharing between a team's devices. Possible later.
- **Keep the query on `backups`, just hash the PIN:** still lets anyone
  list every profile and delete backups — not enough.
- **Longer PIN:** compatible improvement; a 4-digit PIN alone is weak
  without App Check. Could allow 4–8 digits.
