"use client";

/**
 * Precise start-time picker (StartTimeSlider in Flutter): 0–max with 10 ms
 * steps, value floating above the thumb, −/+ nudge buttons.
 */
import { Minus, Plus } from "lucide-react";
import { formatMs } from "@/lib/utils/formatTime";

export function StartTimeSlider({
  valueMs, maxMs, onChange, onChangeEnd, onNudge,
}: {
  valueMs: number;
  maxMs: number;
  onChange: (ms: number) => void;
  onChangeEnd?: (ms: number) => void;
  onNudge?: (deltaMs: number) => void;
}) {
  const v = Math.min(Math.max(0, valueMs), maxMs);
  const fraction = maxMs > 0 ? v / maxMs : 0;
  const end = (e: React.SyntheticEvent<HTMLInputElement>) => onChangeEnd?.(Number(e.currentTarget.value));
  return (
    <div className="flex items-center gap-1">
      <button className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-stage-high" onClick={() => onNudge?.(-500)} aria-label="−0.5 s"><Minus className="h-5 w-5" /></button>
      <div className="relative flex-1 pt-5">
        <span
          className="pointer-events-none absolute top-0 w-20 -translate-x-1/2 text-center text-xs font-bold tabular-nums"
          style={{ left: `clamp(40px, calc(14px + ${fraction} * (100% - 28px)), calc(100% - 40px))` }}
        >
          {formatMs(v)}
        </span>
        <input
          type="range" min={0} max={maxMs} step={10} value={v}
          onChange={e => onChange(Number(e.target.value))}
          onMouseUp={end} onTouchEnd={end} onKeyUp={end}
          className="h-7 w-full cursor-pointer accent-[hsl(var(--stage-text))]"
          aria-label="Start time"
        />
      </div>
      <button className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-stage-high" onClick={() => onNudge?.(500)} aria-label="+0.5 s"><Plus className="h-5 w-5" /></button>
    </div>
  );
}
