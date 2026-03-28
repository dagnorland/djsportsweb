"use client";

import { useEffect } from 'react';

/**
 * Runs the localStorage → Dexie migration once after app data is populated.
 * Called from layout.tsx; safe to run on every page load (idempotent).
 */
export function MigrationRunner() {
  useEffect(() => {
    import('@/lib/db/migration').then(({ runMigrationIfNeeded }) => {
      runMigrationIfNeeded().catch(err =>
        console.error('[migration] Failed to run migration:', err)
      );
    });
  }, []);

  return null;
}
