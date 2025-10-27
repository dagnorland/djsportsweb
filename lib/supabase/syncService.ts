/**
 * Cloud sync service for localStorage data
 */

import { getSupabaseClient } from './client';
import type { Database } from './client';
import { getAllTrackStartTimes, clearAllTrackStartTimes } from '@/lib/utils/trackStartTimes';
import { getAllPlaylistTypes, clearAllPlaylistTypes } from '@/lib/utils/playlistTypes';
import { saveTrackStartTime } from '@/lib/utils/trackStartTimes';
import { savePlaylistType } from '@/lib/utils/playlistTypes';
import type { SyncStatus, UserSyncData, CloudSyncResponse, LocalStorageData } from '@/lib/types/sync';

type UserSyncDataRow = Database['public']['Tables']['user_sync_data']['Row'];

const DEVICE_NAME_KEY = 'djsports_device_name';
const LAST_MODIFIED_KEY = 'djsports_last_modified';

/**
 * Get device name from localStorage
 */
export function getDeviceName(): string {
  if (typeof window === 'undefined') return 'Unknown Device';
  
  try {
    return localStorage.getItem(DEVICE_NAME_KEY) || 'Unknown Device';
  } catch (error) {
    console.error('Failed to get device name:', error);
    return 'Unknown Device';
  }
}

/**
 * Set device name in localStorage
 */
export function setDeviceName(name: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(DEVICE_NAME_KEY, name);
  } catch (error) {
    console.error('Failed to set device name:', error);
  }
}

/**
 * Get last modified timestamp from localStorage
 */
function getLastModified(): string {
  if (typeof window === 'undefined') return new Date().toISOString();
  
  try {
    return localStorage.getItem(LAST_MODIFIED_KEY) || new Date().toISOString();
  } catch (error) {
    console.error('Failed to get last modified:', error);
    return new Date().toISOString();
  }
}

/**
 * Set last modified timestamp in localStorage
 */
export function setLastModified(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(LAST_MODIFIED_KEY, new Date().toISOString());
  } catch (error) {
    console.error('Failed to set last modified:', error);
  }
}

/**
 * Get current localStorage data
 */
function getLocalStorageData(): LocalStorageData {
  return {
    trackStartTimes: getAllTrackStartTimes(),
    playlistTypes: getAllPlaylistTypes(),
    lastModified: getLastModified()
  };
}

/**
 * Get sync status (cloud vs local)
 */
export async function getSyncStatus(spotifyUserId: string): Promise<SyncStatus> {
  try {
    const supabase = getSupabaseClient();

    // Get cloud data
    const { data: cloudData, error } = await supabase
      .from('user_sync_data')
      .select('*')
      .eq('spotify_user_id', spotifyUserId)
      .maybeSingle() as { data: UserSyncDataRow | null; error: any };

    if (error) {
      throw error;
    }

    const localData = getLocalStorageData();

    return {
      hasCloudData: !!cloudData,
      lastCloudSync: cloudData?.last_synced_at || null,
      lastLocalChange: localData.lastModified,
      deviceName: getDeviceName(),
      cloudDeviceName: cloudData?.device_name || null
    };
  } catch (error) {
    console.error('Failed to get sync status:', error);
    return {
      hasCloudData: false,
      lastCloudSync: null,
      lastLocalChange: getLastModified(),
      deviceName: getDeviceName(),
      cloudDeviceName: null
    };
  }
}

/**
 * Save localStorage data to cloud
 */
export async function saveToCloud(spotifyUserId: string): Promise<CloudSyncResponse> {
  try {
    const supabase = getSupabaseClient();
    const localData = getLocalStorageData();
    const deviceName = getDeviceName();
    const now = new Date().toISOString();

    // Check if user already has data
    const { data: existingData } = await supabase
      .from('user_sync_data')
      .select('id')
      .eq('spotify_user_id', spotifyUserId)
      .maybeSingle();

    const syncData = {
      spotify_user_id: spotifyUserId,
      track_start_times: localData.trackStartTimes as any,
      playlist_types: localData.playlistTypes as any,
      device_name: deviceName,
      last_synced_at: now,
      updated_at: now
    };

    let result: { data: UserSyncDataRow | null; error: any };
    if (existingData) {
      // Update existing record
      result = await supabase
        .from('user_sync_data')
        // @ts-ignore - Supabase type inference issue
        .update(syncData)
        .eq('spotify_user_id', spotifyUserId)
        .select()
        .maybeSingle();
    } else {
      // Insert new record
      result = await supabase
        .from('user_sync_data')
        // @ts-ignore - Supabase type inference issue
        .insert(syncData)
        .select()
        .maybeSingle();
    }

    if (result.error) {
      throw result.error;
    }

    // Update local timestamp to match cloud
    setLastModified();

    return {
      success: true,
      data: result.data as any
    };
  } catch (error) {
    console.error('Failed to save to cloud:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Load cloud data to localStorage
 */
export async function loadFromCloud(spotifyUserId: string): Promise<CloudSyncResponse> {
  try {
    const supabase = getSupabaseClient();

    const { data: cloudData, error } = await supabase
      .from('user_sync_data')
      .select('*')
      .eq('spotify_user_id', spotifyUserId)
      .maybeSingle() as { data: UserSyncDataRow | null; error: any };

    if (error) {
      throw error;
    }

    if (!cloudData) {
      return {
        success: false,
        error: 'Ingen data funnet i skyen'
      };
    }

    // Clear existing localStorage data
    clearAllTrackStartTimes();
    clearAllPlaylistTypes();

    // Load track start times
    const trackStartTimes = cloudData.track_start_times as Record<string, number>;
    for (const [trackId, startTime] of Object.entries(trackStartTimes)) {
      saveTrackStartTime(trackId, startTime as number);
    }

    // Load playlist types
    const playlistTypes = cloudData.playlist_types as Record<string, string>;
    for (const [playlistId, playlistType] of Object.entries(playlistTypes)) {
      savePlaylistType(playlistId, playlistType as any);
    }

    // Update device name if different
    if (cloudData.device_name !== getDeviceName()) {
      setDeviceName(cloudData.device_name);
    }

    // Update last modified timestamp to match cloud sync time
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LAST_MODIFIED_KEY, cloudData.last_synced_at);
      } catch (error) {
        console.error('Failed to set last modified:', error);
      }
    }

    return {
      success: true,
      data: cloudData as any
    };
  } catch (error) {
    console.error('Failed to load from cloud:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

