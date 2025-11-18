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
  ArrowLeft
} from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const { data: session } = useSession();

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

          {/* Logout */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <LogOut className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle>Konto</CardTitle>
                  <CardDescription>Logg ut fra Spotify-kontoen din</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium mb-2">Logg ut</p>
                  <p className="text-sm text-muted-foreground">
                    Logg ut fra din Spotify-konto og avslutt sesjonen
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => signOut()}
                  className="ml-4"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logg ut
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </RouteGuard>
  );
}

