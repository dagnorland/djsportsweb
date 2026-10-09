/**
 * Cloud backup location key — the same function as the Flutter app
 * (lib/data/services/cloud_backup_service.dart `profileStorageKey`):
 *
 *   SHA-256("djsports:v1:" + name.trim().toLowerCase() + "|" + pin)  → 64 hex chars
 *
 * Backups live in `profiles/{key}/backups/{id}`. Knowing Profile + PIN is
 * the only way to find them; the PIN is never stored.
 */

/** Splits the combined "Name|1234" lookup key used in settings. */
export function splitProfileKey(combined: string): { name: string; pin: string } {
  const i = combined.lastIndexOf("|");
  return i < 0 ? { name: combined, pin: "" } : { name: combined.slice(0, i), pin: combined.slice(i + 1) };
}

export function profileHashInput(name: string, pin: string): string {
  return `djsports:v1:${name.trim().toLowerCase()}|${pin}`;
}

export async function profileStorageKey(combined: string): Promise<string> {
  const { name, pin } = splitProfileKey(combined);
  const bytes = new TextEncoder().encode(profileHashInput(name, pin));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, "0")).join("");
}
