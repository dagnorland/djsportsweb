"use client";

/** Let's Play settings (Flutter AppSettings) — live from the settings table. */
import { getDb } from "@/lib/db/djsports-db";
import { useLive } from "@/lib/db/useLive";
import { SettingKeys } from "@/lib/db/settings-repo";

export type SidebarPosition = "left" | "right" | "bottom";
export const FADE_VOLUME_MAX_MS = 10_000;

export interface LetsPlaySettings {
  keyboardShortcutsEnabled: boolean;
  fadeVolumeMs: number;
  sidebarPosition: SidebarPosition;
  showInfoToasts: boolean;
}

export const LETS_PLAY_DEFAULTS: LetsPlaySettings = {
  keyboardShortcutsEnabled: false,
  fadeVolumeMs: 0,
  sidebarPosition: "right",
  showInfoToasts: false,
};

export function useLetsPlaySettings(): LetsPlaySettings {
  const rows = useLive(() => getDb().settings.bulkGet([
    SettingKeys.keyboardShortcutsEnabled, SettingKeys.fadeVolumeMs,
    SettingKeys.sidebarPosition, SettingKeys.showInfoToasts,
  ]), []);
  const [k, f, s, i] = rows ?? [];
  const pos = s?.value;
  return {
    keyboardShortcutsEnabled: typeof k?.value === "boolean" ? k.value : LETS_PLAY_DEFAULTS.keyboardShortcutsEnabled,
    fadeVolumeMs: typeof f?.value === "number" ? Math.max(0, Math.min(FADE_VOLUME_MAX_MS, f.value)) : 0,
    sidebarPosition: pos === "left" || pos === "right" || pos === "bottom" ? pos : "right",
    showInfoToasts: typeof i?.value === "boolean" ? i.value : false,
  };
}
