"use client";

import { usePollingSettings, POLLING_INTERVALS } from "@/contexts/PollingSettingsContext";
import type { PollingInterval } from "@/contexts/PollingSettingsContext";
import { Slider } from "@/components/ui/slider";
import { Activity } from "lucide-react";

export function PollingIntervalSlider() {
  const { interval, setInterval } = usePollingSettings();

  // Map interval values to slider indices
  const intervalValues = POLLING_INTERVALS.map(i => i.value);
  const currentIndex = intervalValues.indexOf(interval);

  const handleValueChange = (value: number[]) => {
    const newInterval = intervalValues[value[0]] as PollingInterval;
    setInterval(newInterval);
  };

  // Get label for current interval
  const getLabel = () => {
    if (interval === 0) return 'Off';
    return `${interval / 1000}s`;
  };

  return (
    <div className="flex items-center gap-2 w-full">
      <Activity className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <div className="flex-1">
        <Slider
          value={[currentIndex]}
          onValueChange={handleValueChange}
          min={0}
          max={intervalValues.length - 1}
          step={1}
          className="cursor-pointer"
        />
      </div>
      <span className="text-xs text-muted-foreground w-8 text-right font-medium">
        {getLabel()}
      </span>
    </div>
  );
}
