/**
 * Optimized polling hook with adaptive intervals and performance monitoring
 */

import { useEffect, useRef } from 'react';
import { logger } from '@/lib/utils/logger';

interface UseOptimizedPollingOptions {
  enabled: boolean;
  interval: number;
  maxInterval?: number;
  backoffMultiplier?: number;
  onPoll: () => Promise<void>;
  onError?: (error: Error) => void;
  name?: string;
}

export function useOptimizedPolling({
  enabled,
  interval,
  maxInterval = 30000, // 30 seconds max
  backoffMultiplier = 1.5,
  onPoll,
  onError,
  name = 'polling'
}: UseOptimizedPollingOptions) {
  const intervalRef = useRef<NodeJS.Timeout>();
  const currentIntervalRef = useRef(interval);
  const consecutiveErrorsRef = useRef(0);
  const isPollingRef = useRef(false);
  const onPollRef = useRef(onPoll);
  const onErrorRef = useRef(onError);

  // Keep refs up to date without triggering effects
  useEffect(() => {
    onPollRef.current = onPoll;
  }, [onPoll]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
      return;
    }

    // Update current interval ref
    currentIntervalRef.current = interval;

    const poll = async () => {
      if (isPollingRef.current) return;

      isPollingRef.current = true;

      try {
        await onPollRef.current();
        consecutiveErrorsRef.current = 0;
        currentIntervalRef.current = interval; // Reset to base interval on success
      } catch (error) {
        consecutiveErrorsRef.current++;

        if (process.env.NODE_ENV === 'development') {
          logger.error(`${name} polling failed (attempt ${consecutiveErrorsRef.current}):`, error);
        }

        // Exponential backoff on errors
        if (consecutiveErrorsRef.current > 1) {
          currentIntervalRef.current = Math.min(
            currentIntervalRef.current * backoffMultiplier,
            maxInterval
          );
          if (process.env.NODE_ENV === 'development') {
            logger.warn(`${name} backing off to ${currentIntervalRef.current}ms interval`);
          }
        }

        onErrorRef.current?.(error as Error);
      } finally {
        isPollingRef.current = false;
      }
    };

    // Initial poll
    poll();

    // Set up interval
    intervalRef.current = setInterval(poll, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
    };
  }, [enabled, interval, name, backoffMultiplier, maxInterval]);

  return {
    currentInterval: currentIntervalRef.current,
    consecutiveErrors: consecutiveErrorsRef.current,
    isPolling: isPollingRef.current
  };
}
