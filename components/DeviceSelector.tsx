"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { getAvailableDevices } from "@/lib/spotify";
import { Device } from "@/lib/types";
import { getCachedDevice, cacheDevice, findAndCacheMacDevice } from "@/lib/utils/deviceCache";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RefreshCw, Check } from "lucide-react";
import { logger } from "@/lib/utils/logger";

export function DeviceSelector() {
  const { data: session } = useSession();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [cachedDevice, setCachedDevice] = useState<{ id: string; name: string; type: string } | null>(null);

  // Load cached device on mount
  useEffect(() => {
    const cached = getCachedDevice();
    if (cached) {
      setCachedDevice(cached);
      setSelectedDevice(cached.id);
    }
  }, []);

  // Load available devices
  const loadDevices = async () => {
    if (!session?.accessToken) return;

    setLoading(true);
    try {
      const availableDevices = await getAvailableDevices(session.accessToken);
      setDevices(availableDevices);

      // Auto-select Mac device if no device is selected
      if (!selectedDevice && availableDevices.length > 0) {
        const macDeviceId = findAndCacheMacDevice(availableDevices);
        if (macDeviceId) {
          const macDevice = availableDevices.find(d => d.id === macDeviceId);
          if (macDevice) {
            setSelectedDevice(macDeviceId);
            setCachedDevice({
              id: macDevice.id!,
              name: macDevice.name,
              type: macDevice.type
            });
          }
        }
      }
    } catch (error) {
      logger.error("Feil ved henting av enheter:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load devices on mount and when session changes
  useEffect(() => {
    if (session?.accessToken) {
      loadDevices();
    }
  }, [session?.accessToken]);

  // Handle device selection
  const handleDeviceChange = (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    if (device && device.id) {
      // Cache the selected device
      cacheDevice({
        id: device.id,
        name: device.name,
        type: device.type,
        is_active: device.is_active
      });
      
      setSelectedDevice(device.id);
      setCachedDevice({
        id: device.id,
        name: device.name,
        type: device.type
      });

      if (process.env.NODE_ENV === 'development') {
        logger.spotify(`Valgt enhet: ${device.name} (${device.id})`);
      }
    }
  };

  // Get device display name
  const getDeviceDisplayName = (device: Device) => {
    const activeIndicator = device.is_active ? " 🟢" : "";
    const restrictedIndicator = device.is_restricted ? " ⚠️" : "";
    return `${device.name}${activeIndicator}${restrictedIndicator}`;
  };

  if (!session?.accessToken) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value={selectedDevice || ""}
        onValueChange={handleDeviceChange}
        disabled={loading || devices.length === 0}
      >
        <SelectTrigger className="w-[200px] h-8 text-xs">
          <SelectValue placeholder="Velg enhet">
            {cachedDevice ? (
              <span className="truncate">{cachedDevice.name}</span>
            ) : (
              "Velg enhet"
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {devices.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground">
              Ingen enheter tilgjengelig
            </div>
          ) : (
            devices.map((device) => {
              if (!device.id) return null;
              
              const isSelected = device.id === selectedDevice;
              const isActive = device.is_active;
              
              return (
                <SelectItem
                  key={device.id}
                  value={device.id}
                  disabled={device.is_restricted}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="flex-1 truncate">
                      {getDeviceDisplayName(device)}
                    </span>
                    {isSelected && (
                      <Check className="h-3 w-3 ml-2 flex-shrink-0" />
                    )}
                  </div>
                </SelectItem>
              );
            })
          )}
        </SelectContent>
      </Select>
      
      <Button
        variant="outline"
        size="sm"
        onClick={loadDevices}
        disabled={loading}
        className="h-8 w-8 p-0"
        title="Oppdater enheter"
      >
        <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
      </Button>
      
      {cachedDevice && (
        <div className="hidden lg:flex flex-col gap-0.5 text-xs text-muted-foreground">
          <span className="truncate max-w-[120px]" title={cachedDevice.id}>
            {cachedDevice.name}
          </span>
          {process.env.NODE_ENV === 'development' && (
            <span className="text-[10px] opacity-60 truncate max-w-[120px]" title={cachedDevice.id}>
              ID: {cachedDevice.id.substring(0, 8)}...
            </span>
          )}
        </div>
      )}
    </div>
  );
}

