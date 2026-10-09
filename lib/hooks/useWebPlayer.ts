"use client";

import { useEffect, useState } from "react";
import { getWebPlayerState, subscribeWebPlayer, type WebPlayerState } from "@/lib/spotify/web-player";

export function useWebPlayer(): WebPlayerState {
  const [s, setS] = useState<WebPlayerState>(getWebPlayerState);
  useEffect(() => subscribeWebPlayer(setS), []);
  return s;
}
