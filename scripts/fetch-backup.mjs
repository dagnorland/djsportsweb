// Downloads the latest Flutter cloud backup for a profile into
// test/fixtures/flutter-backup.json (contract-test fixture).
// Usage: node scripts/fetch-backup.mjs "<Profile name>" <4-digit PIN>
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

const [name, pin] = process.argv.slice(2);
if (!name || !/^\d{4}$/.test(pin ?? '')) {
  console.error('Usage: node scripts/fetch-backup.mjs "<Profile name>" <4-digit PIN>');
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]; })
);
const app = initializeApp({
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
});
const db = getFirestore(app);

const key = `${name}|${pin}`;
const snap = await getDocs(query(collection(db, 'backups'), where('profileName', '==', key)));
if (snap.empty) { console.error(`No backups for profile "${name}"`); process.exit(2); }

const docs = snap.docs
  .map(d => ({ id: d.id, ...d.data() }))
  .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
const latest = docs[0];
const out = {
  ...latest,
  profileName: '<redacted>',
  createdAt: latest.createdAt?.toDate?.().toISOString() ?? null,
};
mkdirSync('test/fixtures', { recursive: true });
writeFileSync('test/fixtures/flutter-backup.json', JSON.stringify(out, null, 2));
console.log(`Saved backup ${latest.id} from "${latest.deviceName}" (${out.createdAt}): ` +
  `${latest.playlistCount} playlists, ${latest.trackCount} tracks, ` +
  `${latest.tracksWithStartTime} with start time → test/fixtures/flutter-backup.json`);
process.exit(0);
