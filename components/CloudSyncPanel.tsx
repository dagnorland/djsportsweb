"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Cloud,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  Monitor,
  ChevronDown,
  ChevronUp,
  X,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { toast } from 'sonner';
import { getSyncStatus, saveToCloud, loadFromCloud, getDeviceName, setDeviceName } from '@/lib/supabase/syncService';
import getCurrentUser from '@/lib/spotify/users/getCurrentUser';
import type { SyncStatus } from '@/lib/types/sync';

export function CloudSyncPanel() {
  const { data: session, status } = useSession();
  const [isExpanded, setIsExpanded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [deviceName, setDeviceNameState] = useState('');
  const [spotifyUserId, setSpotifyUserId] = useState<string | null>(null);

  // Get Spotify user ID
  useEffect(() => {
    if (session?.accessToken) {
      getCurrentUser(session.accessToken)
        .then(user => {
          setSpotifyUserId(user.id);
        })
        .catch(error => {
          console.error('Failed to get Spotify user ID:', error);
        });
    }
  }, [session]);

  // Load initial data
  useEffect(() => {
    if (spotifyUserId) {
      loadSyncStatus();
      setDeviceNameState(getDeviceName());
    }
  }, [spotifyUserId]);

  // Refresh sync status when dialog is opened
  useEffect(() => {
    if (isExpanded && spotifyUserId) {
      loadSyncStatus();
    }
  }, [isExpanded, spotifyUserId]);

  // Poll sync status periodically to detect local changes
  useEffect(() => {
    if (!spotifyUserId) return;

    const intervalId = setInterval(() => {
      loadSyncStatus();
    }, 5000); // Check every 5 seconds

    return () => clearInterval(intervalId);
  }, [spotifyUserId]);

  const loadSyncStatus = async () => {
    if (!spotifyUserId) return;
    
    try {
      const status = await getSyncStatus(spotifyUserId);
      setSyncStatus(status);
    } catch (error) {
      console.error('Failed to load sync status:', error);
      toast.error('Kunne ikke laste sync status');
    }
  };

  const handleSaveToCloud = async () => {
    if (!spotifyUserId) {
      toast.error('Ikke innlogget');
      return;
    }

    setLoading(true);
    try {
      const result = await saveToCloud(spotifyUserId);

      if (result.success) {
        toast.success('Data lagret til skyen!');
        setDeviceName(deviceName);
        // Sync successful - timestamps are now equal
        await loadSyncStatus();
      } else {
        toast.error(result.error || 'Kunne ikke lagre til skyen');
      }
    } catch (error) {
      console.error('Save to cloud error:', error);
      toast.error('Kunne ikke lagre til skyen');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadFromCloud = async () => {
    if (!spotifyUserId) {
      toast.error('Ikke innlogget');
      return;
    }

    setLoading(true);
    try {
      const result = await loadFromCloud(spotifyUserId);

      if (result.success) {
        toast.success('Data lastet fra skyen!');
        setDeviceName(deviceName);
        // Sync successful - timestamps are now equal
        await loadSyncStatus();
        // Reload page to reflect changes
        window.location.reload();
      } else {
        toast.error(result.error || 'Kunne ikke laste fra skyen');
      }
    } catch (error) {
      console.error('Load from cloud error:', error);
      toast.error('Kunne ikke laste fra skyen');
    } finally {
      setLoading(false);
    }
  };

  const handleDeviceNameChange = (value: string) => {
    setDeviceNameState(value);
    setDeviceName(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Aldri';
    return new Date(dateString).toLocaleString('no-NO');
  };

  if (status !== 'authenticated' || !spotifyUserId) {
    return null;
  }

  // Determine sync state
  const getSyncState = (): 'backup' | 'restore' | 'synced' | null => {
    if (!syncStatus || !syncStatus.lastCloudSync || !syncStatus.lastLocalChange) {
      return null; // No cloud data yet or no local changes
    }

    // Truncate to seconds (remove milliseconds)
    const cloudTime = Math.floor(new Date(syncStatus.lastCloudSync).getTime() / 1000);
    const localTime = Math.floor(new Date(syncStatus.lastLocalChange).getTime() / 1000);

    console.log('🔍 Sync comparison:');
    console.log('  Local:', new Date(localTime * 1000).toISOString(), `(${localTime}s)`);
    console.log('  Cloud:', new Date(cloudTime * 1000).toISOString(), `(${cloudTime}s)`);

    if (localTime > cloudTime) {
      // Local is newer - needs backup
      console.log('  ↑ Local > Cloud - Backup needed');
      return 'backup';
    } else if (cloudTime > localTime) {
      // Cloud is newer - can restore
      console.log('  ↓ Cloud > Local - Restore available');
      return 'restore';
    }
    console.log('  ✓ In sync');
    return 'synced'; // In sync
  };

  // Determine sync indicator
  const getSyncIndicator = () => {
    const state = getSyncState();
    if (state === 'backup') {
      return <ArrowUp className="h-4 w-4 text-orange-500" />;
    } else if (state === 'restore') {
      return <ArrowDown className="h-4 w-4 text-blue-500" />;
    }
    return null; // In sync or no data
  };

  return (
    <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2 relative">
          <Cloud className="h-4 w-4" />
          <span className="hidden xl:inline">djCloud</span>
          {getSyncIndicator() && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-background border-2 border-primary shadow-sm">
              {getSyncIndicator()}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            djCloud
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Device Name */}
          <div className="space-y-2">
            <Label htmlFor="device-name">Enhetsnavn</Label>
            <div className="flex gap-2">
              <Input
                id="device-name"
                value={deviceName}
                onChange={(e) => handleDeviceNameChange(e.target.value)}
                placeholder="Skriv inn enhetsnavn"
                className="flex-1"
              />
              <Monitor className="h-4 w-4 text-muted-foreground self-center" />
            </div>
          </div>

          <Separator />

          {/* Sync Status */}
          {syncStatus && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Sync Status</span>
                <Badge variant={syncStatus.hasCloudData ? "default" : "secondary"}>
                  {syncStatus.hasCloudData ? "Synkronisert" : "Ikke synkronisert"}
                </Badge>
              </div>

              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Siste cloud sync:</span>
                  <span className="font-mono text-xs">
                    {formatDate(syncStatus.lastCloudSync)}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Siste lokal endring:</span>
                  <span className="font-mono text-xs">
                    {formatDate(syncStatus.lastLocalChange)}
                  </span>
                </div>

                {syncStatus.cloudDeviceName && (
                  <div className="flex items-center gap-2">
                    <Monitor className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Cloud enhet:</span>
                    <span className="text-xs">{syncStatus.cloudDeviceName}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleSaveToCloud}
              disabled={loading}
              variant={getSyncState() === 'backup' ? 'default' : 'outline'}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {loading ? 'Lagrer...' : 'Backup'}
            </Button>

            <Button
              onClick={handleLoadFromCloud}
              disabled={loading}
              variant={getSyncState() === 'restore' ? 'default' : 'outline'}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {loading ? 'Henter...' : 'Restore'}
            </Button>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Lokal data</span>
            </div>
            <div className="flex items-center gap-1">
              <Cloud className="h-3 w-3 text-blue-500" />
              <span>Cloud data</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

