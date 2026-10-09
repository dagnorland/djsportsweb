/**
 * Key/value settings — the Flutter `settings` Hive box. Keys use the same
 * names as Flutter where one exists.
 */
import { getDb } from './djsports-db';

export const SettingKeys = {
  backupProfile: 'backupProfile',
  backupPin: 'backupPin',
  deviceName: 'deviceName',
  fadeVolumeMs: 'fadeVolumeMs',
  keyboardShortcutsEnabled: 'keyboardShortcutsEnabled',
  showInfoToasts: 'showInfoToasts',
  sidebarPosition: 'sidebarPosition',
  webPlayerPanelVisible: 'webPlayerPanelVisible',
  webPlayerPanelHeight: 'webPlayerPanelHeight',
  spotifyPreferredDeviceId: 'spotifyPreferredDeviceId',
  spotifyPreferredDeviceName: 'spotifyPreferredDeviceName',
  lastDjTrackPlayed: 'lastDjTrackPlayed',
  theme: 'theme', // 'dark' | 'light' (web only)
} as const;

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await getDb().settings.get(key);
  return row === undefined ? fallback : (row.value as T);
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await getDb().settings.put({ key, value });
}

/** Dart `backupProfileKeyProvider`: "Name|1234", or '' if incomplete. */
export function backupProfileKey(profile: string, pin: string): string {
  if (!profile || !/^\d{4}$/.test(pin)) return '';
  return `${profile}|${pin}`;
}
