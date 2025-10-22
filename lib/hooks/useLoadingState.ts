/**
 * Hook for managing loading states with automatic timeout and error handling
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { logger } from '@/lib/utils/logger';

interface UseLoadingStateOptions {
  timeout?: number; // Auto-timeout in milliseconds
  onTimeout?: () => void;
  onError?: (error: Error) => void;
}

export function useLoadingState(options: UseLoadingStateOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const { timeout = 30000, onTimeout, onError } = options;

  const startLoading = useCallback(() => {
    setIsLoading(true);
    setError(null);
    
    // Set timeout
    if (timeout > 0) {
      timeoutRef.current = setTimeout(() => {
        logger.warn('Loading operation timed out');
        setIsLoading(false);
        onTimeout?.();
      }, timeout);
    }
  }, [timeout, onTimeout]);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
  }, []);

  const setLoadingError = useCallback((error: Error) => {
    setError(error);
    setIsLoading(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
    onError?.(error);
  }, [onError]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isLoading,
    error,
    startLoading,
    stopLoading,
    setLoadingError,
    clearError,
    isError: !!error
  };
}
