/**
 * Device cache utility for faster playback start
 * Caches the Mac Spotify app device ID to avoid device lookup delays
 */

interface CachedDevice {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
  cachedAt: number;
}

const DEVICE_CACHE_KEY = 'spotify_device_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Cache a device for faster lookup
 */
export function cacheDevice(device: { id: string; name: string; type: string; is_active: boolean }): void {
  try {
    const cached: CachedDevice = {
      ...device,
      cachedAt: Date.now()
    };
    localStorage.setItem(DEVICE_CACHE_KEY, JSON.stringify(cached));
  } catch (error) {
    console.warn('Failed to cache device:', error);
  }
}

/**
 * Get cached device if still valid
 */
export function getCachedDevice(): CachedDevice | null {
  try {
    const cached = localStorage.getItem(DEVICE_CACHE_KEY);
    if (!cached) return null;

    const device: CachedDevice = JSON.parse(cached);
    const age = Date.now() - device.cachedAt;

    // Return cached device if still valid
    if (age < CACHE_DURATION) {
      return device;
    }

    // Cache expired, remove it
    localStorage.removeItem(DEVICE_CACHE_KEY);
    return null;
  } catch (error) {
    console.warn('Failed to get cached device:', error);
    return null;
  }
}

/**
 * Find and cache Mac Spotify app device from list of devices
 * Prioritizes active Mac devices
 * Only auto-selects if no device is already cached
 */
export function findAndCacheMacDevice(devices: Array<{ id: string | null; name: string; type: string; is_active: boolean }>): string | null {
  // Filter out devices with null id
  const validDevices = devices.filter((d): d is { id: string; name: string; type: string; is_active: boolean } => d.id !== null);
  
  if (validDevices.length === 0) {
    return null;
  }

  // Check if we already have a cached device - don't override user selection
  const existingCache = getCachedDevice();
  if (existingCache) {
    // Verify the cached device still exists in the list
    const cachedStillExists = validDevices.find(d => d.id === existingCache.id);
    if (cachedStillExists) {
      return existingCache.id;
    }
    // Cached device no longer exists, clear cache and continue
    clearDeviceCache();
  }

  // First, try to find active Mac device
  const activeMacDevice = validDevices.find(
    device => device.is_active && (device.type === 'computer' || device.name.toLowerCase().includes('mac'))
  );

  if (activeMacDevice) {
    cacheDevice(activeMacDevice);
    return activeMacDevice.id;
  }

  // Fallback: find any Mac device
  const macDevice = validDevices.find(
    device => device.type === 'computer' || device.name.toLowerCase().includes('mac')
  );

  if (macDevice) {
    cacheDevice(macDevice);
    return macDevice.id;
  }

  // Fallback: use first active device
  const activeDevice = validDevices.find(device => device.is_active);
  if (activeDevice) {
    cacheDevice(activeDevice);
    return activeDevice.id;
  }

  // Last resort: use first device
  if (validDevices.length > 0) {
    cacheDevice(validDevices[0]);
    return validDevices[0].id;
  }

  return null;
}

/**
 * Clear device cache
 */
export function clearDeviceCache(): void {
  try {
    localStorage.removeItem(DEVICE_CACHE_KEY);
  } catch (error) {
    console.warn('Failed to clear device cache:', error);
  }
}

