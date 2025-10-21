"use client";

import { PlaylistTrack } from "@/lib/types";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { List, Sliders } from "lucide-react";
import TrackList from "./TrackList";
import TrackListSetStartTime from "./TrackListSetStartTime";

interface TrackListSwitcherProps {
  tracks: PlaylistTrack[];
  loading?: boolean;
  onPlayTrack?: (trackUri: string, position: number, startTime?: number) => void;
  onPauseTrack?: () => void;
  onNavigatePlaylist?: (direction: 'next' | 'previous') => void;
}

export default function TrackListSwitcher({ tracks, loading = false, onPlayTrack, onPauseTrack, onNavigatePlaylist }: TrackListSwitcherProps) {
  const [activeView, setActiveView] = useState<"list" | "slider">("slider");

  return (
    <div className="space-y-4">
      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as "list" | "slider")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="slider" className="flex items-center gap-2">
            <Sliders className="h-4 w-4" />
            Starttid slider
          </TabsTrigger>

          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Standard liste
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="slider" className="mt-4">
          <TrackListSetStartTime 
            tracks={tracks} 
            loading={loading} 
            onPlayTrack={onPlayTrack}
            onPauseTrack={onPauseTrack}
            onNavigatePlaylist={onNavigatePlaylist}
          />
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          <TrackList 
            tracks={tracks} 
            loading={loading} 
            onPlayTrack={onPlayTrack} 
          />
        </TabsContent>
        

      </Tabs>
    </div>
  );
}
