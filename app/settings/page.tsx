"use client";

import { useSession, signOut } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeSwitcherTransition } from "@/components/ui/theme-switcher-transition";
import { CloudSyncPanel } from "@/components/CloudSyncPanel";
import { DeviceSelector } from "@/components/DeviceSelector";
import { PollingIntervalSlider } from "@/components/PollingIntervalSlider";
import { RouteGuard } from "@/components/RouteGuard";
import { 
  Settings, 
  Palette, 
  Cloud, 
  Activity, 
  Smartphone, 
  LogOut,
  ArrowLeft,
  User
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PrivateUser } from "@/lib/types";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { clearLocalStorage } from "@/lib/utils/logout";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [userInfo, setUserInfo] = useState<PrivateUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!session?.accessToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("https://api.spotify.com/v1/me", {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });

        if (response.ok) {
          const data: PrivateUser = await response.json();
          setUserInfo(data);
        }
      } catch (error) {
        console.error("Failed to fetch user info:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [session?.accessToken]);

  return (
    <RouteGuard>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/match">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tilbake
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Settings className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Innstillinger</h1>
          </div>
        </div>

        {/* User info */}
        {session && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Bruker</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{session.user?.name || session.user?.email}</p>
                  <p className="text-sm text-muted-foreground">{session.user?.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {/* Appearance */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Palette className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle>Utseende</CardTitle>
                  <CardDescription>Velg fargetema for applikasjonen</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium mb-2">Tema</p>
                  <p className="text-sm text-muted-foreground">
                    Velg mellom lys, mørk eller sports-tema
                  </p>
                </div>
                <ThemeSwitcherTransition />
              </div>
            </CardContent>
          </Card>

          {/* Spotify Device */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle>Spotify Enhet</CardTitle>
                  <CardDescription>Velg hvilken enhet som skal brukes for avspilling</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm font-medium">Enhet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Velg hvilken Spotify-enhet som skal brukes når du starter avspilling
                </p>
                <DeviceSelector />
              </div>
            </CardContent>
          </Card>

          {/* Polling Interval */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle>Oppdateringsfrekvens</CardTitle>
                  <CardDescription>Hvor ofte applikasjonen skal oppdatere nåværende avspilling</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm font-medium mb-2">Polling Intervall</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Juster hvor ofte systemet sjekker for endringer i avspilling. Lavere intervall gir bedre responsivitet, men bruker mer ressurser.
                </p>
                <PollingIntervalSlider />
              </div>
            </CardContent>
          </Card>

          {/* Cloud Sync */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Cloud className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle>DJ Cloud Sync</CardTitle>
                  <CardDescription>Synkroniser starttider mellom enheter</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CloudSyncPanel />
            </CardContent>
          </Card>

          {/* Account */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle>Konto</CardTitle>
                  <CardDescription>Din Spotify-kontoinformasjon</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-64" />
                    </div>
                  </div>
                </div>
              ) : userInfo ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    {userInfo.images && userInfo.images.length > 0 ? (
                      <Image
                        src={userInfo.images[0].url}
                        alt={userInfo.display_name || "Bruker"}
                        width={64}
                        height={64}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-lg">
                        {userInfo.display_name || "Ingen navn"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {userInfo.email || "Ingen e-post"}
                      </p>
                      {userInfo.product && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {userInfo.product === "premium" ? "Spotify Premium" : "Spotify Free"}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-2">Logg ut</p>
                        <p className="text-sm text-muted-foreground">
                          Logg ut fra din Spotify-konto og avslutt sesjonen
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={async () => {
                          clearLocalStorage();
                          await signOut({ redirect: false });
                          window.location.href = '/?cleaned=true';
                        }}
                        className="ml-4"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logg ut
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    Kunne ikke laste kontoinformasjon
                  </p>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      clearLocalStorage();
                      await signOut({ redirect: false });
                      window.location.href = '/?cleaned=true';
                    }}
                    className="mt-4"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logg ut
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </RouteGuard>
  );
}

