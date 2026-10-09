// One-off migration for the Firestore security update
// (docs/FIRESTORE_SECURITY_PLAN.md):
//
//   backups/{id} (profileName "Name|1234" in clear text)
//     → profiles/{SHA-256 key}/backups/{id}   (without profileName)
//
// Run it while the OLD open rules are still deployed, then deploy the new
// firestore.rules from the djsports repo.
//
//   node scripts/migrate-backups.mjs            # dry run: shows what would happen
//   node scripts/migrate-backups.mjs --copy     # copy to the new location
//   node scripts/migrate-backups.mjs --copy --delete-old   # copy, verify, delete old docs
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { initializeApp } from 'firebase/app';
import { collection, deleteDoc, doc, getDoc, getDocs, getFirestore, setDoc } from 'firebase/firestore';

const args = new Set(process.argv.slice(2));
const COPY = args.has('--copy');
const DELETE_OLD = args.has('--delete-old');

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]; }),
);
const db = getFirestore(initializeApp({
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
}));

/** Same as lib/backup/profile-key.ts and the Flutter profileStorageKey(). */
function storageKey(profileName) {
  const i = profileName.lastIndexOf('|');
  const name = i < 0 ? profileName : profileName.slice(0, i);
  const pin = i < 0 ? '' : profileName.slice(i + 1);
  return createHash('sha256').update(`djsports:v1:${name.trim().toLowerCase()}|${pin}`, 'utf8').digest('hex');
}

const snap = await getDocs(collection(db, 'backups'));
console.log(`${snap.size} backup(s) in the old collection. Mode: ${COPY ? (DELETE_OLD ? 'copy + delete old' : 'copy') : 'dry run'}`);

const profiles = new Map();
let copied = 0, existed = 0, deleted = 0;
const skipped = [];
for (const d of snap.docs) {
  const data = d.data();
  const profileName = typeof data.profileName === 'string' ? data.profileName : '';
  if (!/\|\d{4,8}$/.test(profileName)) { skipped.push(`${d.id} (${data.deviceName ?? '?'}, no profile + PIN)`); continue; }
  const key = storageKey(profileName);
  const label = profileName.slice(0, profileName.lastIndexOf('|'));
  profiles.set(label, (profiles.get(label) ?? 0) + 1);
  const target = doc(db, 'profiles', key, 'backups', d.id);
  if (!COPY) continue;
  const { profileName: _drop, ...rest } = data;
  const already = await getDoc(target);
  if (already.exists()) existed++;
  else { await setDoc(target, rest); copied++; }
  if (DELETE_OLD) {
    const check = await getDoc(target);
    if (check.exists() && (check.data().tracks?.length ?? -1) === (rest.tracks?.length ?? -2)) {
      await deleteDoc(d.ref);
      deleted++;
    } else {
      console.warn(`  ! ${d.id}: copy not verified, old doc kept`);
    }
  }
}

console.log('\nProfiles (name → backups):');
for (const [name, n] of profiles) console.log(`  ${name} → ${n}`);
if (skipped.length) {
  console.log(`\nSkipped ${skipped.length} without profile + PIN (old web backups by Spotify user; they stay in the old`);
  console.log('collection and become unreadable with the new rules — restore + back up again first if needed):');
  for (const s of skipped) console.log(`  ${s}`);
}
if (COPY) console.log(`\nCopied ${copied}, already there ${existed}${DELETE_OLD ? `, deleted old ${deleted}` : ''}.`);
else console.log('\nDry run — nothing changed. Re-run with --copy (and --delete-old) to migrate.');
process.exit(0);
