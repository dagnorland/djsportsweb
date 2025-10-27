/**
 * Type definitions for cloud sync functionality
 */

export interface SyncStatus {
  hasCloudData: boolean;
  lastCloudSync: string | null;
  lastLocalChange: string | null;
  deviceName: string | null;
  cloudDeviceName: string | null;
}

export interface UserSyncData {
  id: string;
  spotify_user_id: string;
  track_start_times: Record<string, number>;
  playlist_types: Record<string, string>;
  device_name: string;
  last_synced_at: string;
  created_at: string;
  updated_at: string;
}

export interface CloudSyncResponse {
  success: boolean;
  data?: UserSyncData;
  error?: string;
}

export interface LocalStorageData {
  trackStartTimes: Record<string, number>;
  playlistTypes: Record<string, string>;
  lastModified: string;
}

