"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
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
  Trash2,
  Monitor,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  createBackup,
  listBackupsForAccount,
  restoreBackup,
  deleteBackup,
} from '@/lib/firebase/firestore-backup-service';
import getCurrentUser from '@/lib/spotify/users/getCurrentUser';
import type { BackupSummary } from '@/lib/types/djmodels';

const DEVICE_NAME_KEY = 'djsports_device_name';

function getStoredDeviceName(): string {
  try {
    return window.localStorage.getItem(DEVICE_NAME_KEY) ?? '';
  } catch (_) {
    return '';
  }
}

function setStoredDeviceName(name: string): void {
  try {
    window.localStorage.setItem(DEVICE_NAME_KEY, name);
  } catch (_) { /* ignore */ }
}

export function FirestoreBackupPanel() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [backups, setBackups] = useState<BackupSummary[]>([]);
  const [deviceName, setDeviceNameState] = useState('');
  const [spotifyUser, setSpotifyUser] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDeviceNameState(getStoredDeviceName());
    }
  }, []);

  useEffect(() => {
    if (session?.accessToken) {
      getCurrentUser(session.accessToken)
        .then(user => setSpotifyUser({ id: user.id, name: user.display_name ?? user.id }))
        .catch(err => console.error('Failed to get Spotify user:', err));
    }
  }, [session?.accessToken]);

  const loadBackups = useCallback(async () => {
    if (!spotifyUser) return;
    try {
      const list = await listBackupsForAccount(spotifyUser.id);
      setBackups(list);
    } catch (err) {
      console.error('Failed to list backups:', err);
      toast.error('Kunne ikke laste sikkerhetskopier');
    }
  }, [spotifyUser]);

  useEffect(() => {
    if (isOpen && spotifyUser) {
      loadBackups();
    }
  }, [isOpen, spotifyUser, loadBackups]);

  const handleCreate = async () => {
    if (!spotifyUser) return;
    setLoading(true);
    try {
      await createBackup(spotifyUser.id, spotifyUser.name, deviceName || 'Web');
      toast.success('Sikkerhetskopi opprettet!');
      await loadBackups();
    } catch (err) {
      console.error('Create backup error:', err);
      toast.error('Kunne ikke opprette sikkerhetskopi');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (backupId: string) => {
    setLoading(true);
    try {
      await restoreBackup(backupId);
      toast.success('Data gjenopprettet! Laster siden på nytt...');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      console.error('Restore backup error:', err);
      toast.error('Kunne ikke gjenopprette sikkerhetskopi');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (backupId: string) => {
    setLoading(true);
    try {
      await deleteBackup(backupId);
      toast.success('Sikkerhetskopi slettet');
      await loadBackups();
    } catch (err) {
      console.error('Delete backup error:', err);
      toast.error('Kunne ikke slette sikkerhetskopi');
    } finally {
      setLoading(false);
    }
  };

  const handleDeviceNameChange = (value: string) => {
    setDeviceNameState(value);
    setStoredDeviceName(value);
  };

  if (status !== 'authenticated' || !spotifyUser) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Cloud className="h-4 w-4" />
          <span className="hidden xl:inline">djCloud</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            DJ Cloud Backup
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Device name */}
          <div className="space-y-2">
            <Label htmlFor="device-name">Enhetsnavn</Label>
            <div className="flex gap-2">
              <Input
                id="device-name"
                value={deviceName}
                onChange={e => handleDeviceNameChange(e.target.value)}
                placeholder="Skriv inn enhetsnavn"
                className="flex-1"
              />
              <Monitor className="h-4 w-4 text-muted-foreground self-center" />
            </div>
          </div>

          {/* Create backup */}
          <Button
            onClick={handleCreate}
            disabled={loading}
            className="w-full flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {loading ? 'Lagrer...' : 'Opprett sikkerhetskopi'}
          </Button>

          <Separator />

          {/* Backup list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Sikkerhetskopier</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadBackups}
                disabled={loading}
                className="h-7 px-2"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>

            {backups.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Ingen sikkerhetskopier funnet
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {backups.map(backup => (
                  <div
                    key={backup.id}
                    className="border rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium truncate">
                            {backup.deviceName}
                          </span>
                          <Badge variant="secondary" className="text-xs shrink-0">
                            {backup.playlistCount} spillelister
                          </Badge>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {backup.tracksWithStartTime} starttider
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {backup.createdAt.toLocaleString('no-NO')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRestore(backup.id)}
                        disabled={loading}
                        className="flex-1 flex items-center gap-1"
                      >
                        <Download className="h-3 w-3" />
                        Gjenopprett
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(backup.id)}
                        disabled={loading}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
