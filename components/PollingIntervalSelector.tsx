"use client";

import { usePollingSettings, POLLING_INTERVALS } from "@/contexts/PollingSettingsContext";
import type { PollingInterval } from "@/contexts/PollingSettingsContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Activity } from "lucide-react";

export function PollingIntervalSelector() {
  const { interval, setInterval } = usePollingSettings();

  return (
    <Select
      value={interval.toString()}
      onValueChange={(value) => setInterval(parseInt(value, 10) as PollingInterval)}
    >
      <SelectTrigger className="w-[140px] h-9">
        <Activity className="h-4 w-4 mr-2" />
        <SelectValue placeholder="Polling" />
      </SelectTrigger>
      <SelectContent>
        {POLLING_INTERVALS.map((option) => (
          <SelectItem key={option.value} value={option.value.toString()}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
