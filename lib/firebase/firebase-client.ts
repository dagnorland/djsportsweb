/**
 * Firebase app + Firestore singleton — SSR-safe.
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

function getFirebaseConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
}

export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === 'undefined') return null;

  if (!app) {
    const config = getFirebaseConfig();
    if (!config.projectId) {
      console.warn('[firebase] NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set');
      return null;
    }
    app = getApps().length === 0 ? initializeApp(config) : getApps()[0];
  }
  return app;
}

export function getFirestoreDb(): Firestore | null {
  if (typeof window === 'undefined') return null;

  if (!db) {
    const firebaseApp = getFirebaseApp();
    if (!firebaseApp) return null;
    db = getFirestore(firebaseApp);
  }
  return db;
}
