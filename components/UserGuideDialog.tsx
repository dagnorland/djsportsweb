"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UserGuideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const norwegianGuide = `# DJ Sports - Brukerveiledning

En komplett guide for å bruke DJ Sports applikasjonen.

## Komme i gang

### Første gangs pålogging
1. Åpne DJ Sports applikasjonen
2. Klikk på **"Logg inn med Spotify"**
3. Godkjenn tilgang til din Spotify-konto
4. Du blir automatisk sendt til Spillelister-siden

### Grunnleggende navigasjon
- **Spillelister**: Hovedsiden for å administrere spillelister, typer og starttider
- **Kamp**: Live DJ-visning for kamp-situasjoner med karuseller per type
- **Temavelger** (☀️/🌙/⚡): Bytt mellom Light, Dark og SPORTS-tema
- **djCloud** (☁️): Synkroniser data mellom enheter
- **Log**: Vis ytelsesstatistikk (kun synlig på Kamp-siden)

## Oppsett av spillelister

### Søke i spillelister
1. Klikk på søkeikonet (🔍) øverst i spilleliste-listen
2. Skriv inn søkeord
3. Trykk **X** for å tømme søket

### Navigere mellom spillelister
- **Klikk** på en spilleliste for å se sporene
- **Piltast opp/ned**: Bytt mellom spillelister
- **Tab**: Flytt fokus mellom spilleliste og sporliste

## Sette spilleliste-typer

### Tilgjengelige typer
- **🔥 Hotspot**: Høyenergi musikk for intense øyeblikk
- **⚽ Match**: Hovedmusikk under kampen
- **🎉 Fun Stuff**: Morsom og engasjerende musikk
- **🏟️ Pre Match**: Oppvarmingsmusikk før kampen

### Slik setter du type
1. Gå til **Spillelister**-siden
2. Velg en spilleliste i venstre kolonne
3. Finn **Spilleliste Type** i høyre kolonne
4. Velg type fra rullegardinmenyen
5. Typen lagres automatisk

## Sette starttider på spor

### Slik setter du starttid
1. Gå til **Spillelister**-siden
2. Velg en spilleliste
3. Klikk på **tidsikonet** (🕐) ved sporet
4. Dra slideren til ønsket startposisjon
5. Starttiden lagres automatisk

### Visning av starttider
- **Spillelister-siden**: Starttid vises ved siden av sporets varighet (f.eks. "→ 1:23")
- **Kamp-siden**: Starttid vises som chip på albumbildet
  - **Lys chip** = starttid er satt
  - **Transparent chip** = starttid er 0:00

## Bruke Kamp-siden

### Spilleliste-karusell
Hver karusell viser:
- Spilleliste-navn og spor-teller (f.eks. "1/12")
- Albumbildet til gjeldende spor
- Forrige/Neste-knapper på sidene
- Play/Pause-knapp på albumbildet
- Starttid-chip på bunnen av bildet

### Spille spor
1. Klikk på **Play-knappen** (▶) på albumbildet
2. Sporet starter umiddelbart på Spotify
3. Albumbildet **animerer** når sporet spiller
4. Play-knappen endres til **Pause** (⏸)

### Skjule/vise seksjoner
- Klikk på **type-overskriften** (f.eks. "🔥 HOT") for å skjule/vise
- Flere seksjoner kan være åpne samtidig

## djCloud - Sky-synkronisering

### Backup (Last opp til skyen)
1. Åpne djCloud-panelet
2. Klikk på **Backup**-knappen
3. Dine typer og starttider lastes opp

### Restore (Last ned fra skyen)
1. Åpne djCloud-panelet
2. Klikk på **Restore**-knappen
3. Data fra skyen lastes ned

### Sync Status
- **Grønn hake (✓)**: Alt er synkronisert
- **Oransje pil opp (↑)**: Last opp dine endringer
- **Blå pil ned (↓)**: Last ned fra skyen

## Innstillinger

### Polling-intervall
Kontroller hvor ofte app'en sjekker Spotify:
- **1s** til **15s**: Ulike hastigheter
- **Off**: Ingen automatisk oppdatering

### Temaer
- **☀️ Light**: Lyst tema
- **🌙 Dark**: Mørkt tema (standard)
- **⚡ SPORTS**: Gul/svart tema

## Tips og triks

### For raskest sporoppstart
1. Sett polling-intervall til **3s** eller lavere
2. Hold Spotify-appen åpen
3. Bruk starttider for å unngå lange introer

### Under kampen
1. Åpne **Kamp-siden**
2. Hold alle seksjoner åpne for rask tilgang
3. Bruk karusellene for å bytte mellom spor

---

*For fullstendig dokumentasjon, se BRUKERVEILEDNING.md i prosjektmappen*
`;

const englishGuide = `# DJ Sports - User Guide

A complete guide for using the DJ Sports application.

## Getting Started

### First Time Login
1. Open the DJ Sports application
2. Click **"Log in with Spotify"**
3. Authorize access to your Spotify account
4. You'll be automatically redirected to the Playlists page

### Basic Navigation
- **Playlists**: Main page for managing playlists, types, and start times
- **Match**: Live DJ view for match situations with carousels per type
- **Theme Switcher** (☀️/🌙/⚡): Switch between Light, Dark, and SPORTS themes
- **djCloud** (☁️): Synchronize data between devices
- **Log**: Show performance statistics (only visible on Match page)

## Setting Up Playlists

### Searching Playlists
1. Click the search icon (🔍) at the top of the playlist list
2. Enter search terms
3. Press **X** to clear the search

### Navigating Between Playlists
- **Click** on a playlist to view its tracks
- **Arrow keys up/down**: Switch between playlists
- **Tab**: Move focus between playlist and track list

## Setting Playlist Types

### Available Types
- **🔥 Hotspot**: High-energy music for intense moments
- **⚽ Match**: Main music during the match
- **🎉 Fun Stuff**: Fun and engaging music
- **🏟️ Pre Match**: Warm-up music before the match

### How to Set Type
1. Go to the **Playlists** page
2. Select a playlist in the left column
3. Find **Playlist Type** in the right column
4. Select type from the dropdown menu
5. The type is automatically saved

## Setting Track Start Times

### How to Set Start Time
1. Go to the **Playlists** page
2. Select a playlist
3. Click the **time icon** (🕐) next to the track
4. Drag the slider to the desired start position
5. The start time is automatically saved

### Display of Start Times
- **Playlists page**: Start time shown next to track duration (e.g., "→ 1:23")
- **Match page**: Start time shown as chip on album image
  - **Bright chip** = start time is set
  - **Transparent chip** = start time is 0:00

## Using the Match Page

### Playlist Carousel
Each carousel shows:
- Playlist name and track counter (e.g., "1/12")
- Album image of current track
- Previous/Next buttons on the sides
- Play/Pause button on the album image
- Start time chip at the bottom of the image

### Playing Tracks
1. Click the **Play button** (▶) on the album image
2. The track starts immediately on Spotify
3. The album image **animates** when playing
4. Play button changes to **Pause** (⏸)

### Hide/Show Sections
- Click on the **type heading** (e.g., "🔥 HOT") to hide/show
- Multiple sections can be open simultaneously

## djCloud - Cloud Synchronization

### Backup (Upload to Cloud)
1. Open the djCloud panel
2. Click the **Backup** button
3. Your types and start times are uploaded

### Restore (Download from Cloud)
1. Open the djCloud panel
2. Click the **Restore** button
3. Data from the cloud is downloaded

### Sync Status
- **Green checkmark (✓)**: Everything is synchronized
- **Orange up arrow (↑)**: Upload your changes
- **Blue down arrow (↓)**: Download from cloud

## Settings

### Polling Interval
Control how often the app checks Spotify:
- **1s** to **15s**: Different speeds
- **Off**: No automatic updates

### Themes
- **☀️ Light**: Bright theme
- **🌙 Dark**: Dark theme (default)
- **⚡ SPORTS**: Yellow/black theme

## Tips and Tricks

### For Fastest Track Startup
1. Set polling interval to **3s** or lower
2. Keep Spotify app open
3. Use start times to avoid long intros

### During the Match
1. Open the **Match page**
2. Keep all sections open for quick access
3. Use carousels to switch between tracks

---

*For complete documentation, see USER_GUIDE.md in the project folder*
`;

export function UserGuideDialog({ open, onOpenChange }: UserGuideDialogProps) {
  const [language, setLanguage] = useState<"no" | "en">("no");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Brukerveiledning / User Guide</DialogTitle>
        </DialogHeader>

        <Tabs value={language} onValueChange={(value) => setLanguage(value as "no" | "en")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="no">🇳🇴 Norsk</TabsTrigger>
            <TabsTrigger value="en">🇬🇧 English</TabsTrigger>
          </TabsList>

          <TabsContent value="no" className="mt-4">
            <ScrollArea className="h-[calc(80vh-120px)] pr-4">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap font-mono text-xs">
                  {norwegianGuide}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="en" className="mt-4">
            <ScrollArea className="h-[calc(80vh-120px)] pr-4">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap font-mono text-xs">
                  {englishGuide}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Lukk / Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
