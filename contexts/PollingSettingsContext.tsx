"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type PollingInterval = 0 | 1000 | 2000 | 3000 | 5000 | 10000 | 15000;

export const POLLING_INTERVALS = [
  { value: 1000, label: '1s (Fast)' },
  { value: 2000, label: '2s' },
  { value: 3000, label: '3s (Default)' },
  { value: 5000, label: '5s' },
  { value: 10000, label: '10s' },
  { value: 15000, label: '15s (Slow)' },
  { value: 0, label: 'Off (Manual)' },
] as const;

const STORAGE_KEY = 'djsports_polling_interval';
const DEFAULT_INTERVAL: PollingInterval = 3000;

interface PollingSettingsContextType {
  interval: PollingInterval;
  setInterval: (interval: PollingInterval) => void;
}

const PollingSettingsContext = createContext<PollingSettingsContextType | undefined>(undefined);

export function PollingSettingsProvider({ children }: { children: ReactNode }) {
  const [interval, setIntervalState] = useState<PollingInterval>(DEFAULT_INTERVAL);

  // Load interval from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = parseInt(stored, 10);
        // Validate it's a valid interval
        if (POLLING_INTERVALS.some(i => i.value === parsed)) {
          setIntervalState(parsed as PollingInterval);
        }
      }
    } catch (error) {
      console.error('Failed to load polling interval:', error);
    }
  }, []);

  const setInterval = (newInterval: PollingInterval) => {
    setIntervalState(newInterval);
    try {
      localStorage.setItem(STORAGE_KEY, newInterval.toString());
    } catch (error) {
      console.error('Failed to save polling interval:', error);
    }
  };

  return (
    <PollingSettingsContext.Provider value={{ interval, setInterval }}>
      {children}
    </PollingSettingsContext.Provider>
  );
}

export function usePollingSettings() {
  const context = useContext(PollingSettingsContext);
  if (!context) {
    throw new Error('usePollingSettings must be used within PollingSettingsProvider');
  }
  return context;
}
