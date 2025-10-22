/**
 * Optimized polling hook with adaptive intervals and performance monitoring
 */

import { useEffect, useRef, useCallback } from 'react';
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

  const poll = useCallback(async () => {
    if (isPollingRef.current) return;
    
    isPollingRef.current = true;
    const startTime = Date.now();
    
    try {
      await onPoll();
      consecutiveErrorsRef.current = 0;
      currentIntervalRef.current = interval; // Reset to base interval on success
    } catch (error) {
      consecutiveErrorsRef.current++;
      const duration = Date.now() - startTime;
      
      logger.error(`${name} polling failed (attempt ${consecutiveErrorsRef.current}):`, error);
      
      // Exponential backoff on errors
      if (consecutiveErrorsRef.current > 1) {
        currentIntervalRef.current = Math.min(
          currentIntervalRef.current * backoffMultiplier,
          maxInterval
        );
        logger.warn(`${name} backing off to ${currentIntervalRef.current}ms interval`);
      }
      
      onError?.(error as Error);
    } finally {
      isPollingRef.current = false;
    }
  }, [onPoll, onError, name, interval, backoffMultiplier, maxInterval]);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
      return;
    }

    // Initial poll
    poll();

    // Set up interval
    intervalRef.current = setInterval(poll, currentIntervalRef.current);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
    };
  }, [enabled, poll]);

  // Update interval when it changes
  useEffect(() => {
    if (enabled && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(poll, currentIntervalRef.current);
    }
  }, [enabled, poll]);

  return {
    currentInterval: currentIntervalRef.current,
    consecutiveErrors: consecutiveErrorsRef.current,
    isPolling: isPollingRef.current
  };
}
