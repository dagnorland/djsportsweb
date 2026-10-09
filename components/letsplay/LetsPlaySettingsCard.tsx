"use client";

/** "LET'S PLAY SETTINGS" — port of track_time/tabs/settings_tab.dart (web subset). */
import { setSetting, SettingKeys } from "@/lib/db/settings-repo";
import { FADE_VOLUME_MAX_MS, useLetsPlaySettings, type SidebarPosition } from "@/lib/letsplay/settings";
import { setShowInfoToasts } from "@/lib/ui/app-toast";
import { cn } from "@/lib/utils";

function Toggle({ checked, onChange, label, help }: { checked: boolean; onChange: (v: boolean) => void; label: string; help: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-sm text-muted-foreground">{help}</span>
      </span>
      <input type="checkbox" role="switch" className="mt-1 h-5 w-9 shrink-0 cursor-pointer accent-current" checked={checked} onChange={e => onChange(e.target.checked)} />
    </label>
  );
}

export function LetsPlaySettingsCard() {
  const s = useLetsPlaySettings();
  const positions: SidebarPosition[] = ["left", "right", "bottom"];
  return (
    <div className="space-y-5">
      <Toggle
        label="Keyboard shortcuts"
        help="Enable to use keyboard keys to trigger playlists. Hotspot 1–6 • Match Q–Y • Fun A–H • P = play • Esc = pause • +/− = volume"
        checked={s.keyboardShortcutsEnabled}
        onChange={v => setSetting(SettingKeys.keyboardShortcutsEnabled, v)}
      />
      <Toggle
        label="Show info messages"
        help={'Pop-ups like "PAUSED", "FADED" and the track that started. Warnings and errors always show.'}
        checked={s.showInfoToasts}
        onChange={v => { setShowInfoToasts(v); setSetting(SettingKeys.showInfoToasts, v); }}
      />
      <div>
        <p className="text-sm font-medium">Fade volume on pause</p>
        <p className="mb-2 text-sm text-muted-foreground">
          Shows an extra fade pause button in Let&apos;s Play that lowers the volume over this time before pausing. 0 = off.
        </p>
        <div className="flex items-center gap-3">
          <input type="range" min={0} max={FADE_VOLUME_MAX_MS} step={250} value={s.fadeVolumeMs}
            onChange={e => setSetting(SettingKeys.fadeVolumeMs, Number(e.target.value))} className="flex-1" aria-label="Fade time" />
          <span className="w-20 text-right text-sm font-semibold tabular-nums">{s.fadeVolumeMs === 0 ? "Off" : `${s.fadeVolumeMs} ms`}</span>
        </div>
      </div>
      <div>
        <p className="text-sm font-medium">Control bar position</p>
        <p className="mb-2 text-sm text-muted-foreground">On wide screens. Bottom needs a tall enough window – otherwise it moves to the right.</p>
        <div className="inline-flex rounded-full bg-muted p-1">
          {positions.map(p => (
            <button key={p} onClick={() => setSetting(SettingKeys.sidebarPosition, p)}
              className={cn("h-8 rounded-full px-4 text-sm font-medium capitalize", s.sidebarPosition === p ? "bg-foreground text-background" : "text-muted-foreground")}>
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
