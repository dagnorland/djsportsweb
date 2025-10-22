/**
 * Centralized error handling utilities
 */

import { logger } from './logger';

export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  userMessage?: string;
  isRetryable?: boolean;
}

export class SpotifyAPIError extends Error implements AppError {
  code: string;
  statusCode: number;
  userMessage: string;
  isRetryable: boolean;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.name = 'SpotifyAPIError';
    this.statusCode = statusCode;
    this.code = code || 'UNKNOWN_ERROR';
    this.isRetryable = statusCode >= 500 || statusCode === 429; // Server errors and rate limits
    this.userMessage = this.getUserFriendlyMessage();
  }

  private getUserFriendlyMessage(): string {
    switch (this.statusCode) {
      case 401:
        return 'Du må logge inn på nytt. Vennligst oppdater siden.';
      case 403:
        return 'Du har ikke tilgang til denne funksjonen.';
      case 404:
        return 'Spillelisten eller sporet ble ikke funnet.';
      case 429:
        return 'For mange forespørsler. Vennligst vent litt og prøv igjen.';
      case 500:
      case 502:
      case 503:
      case 504:
        return 'Spotify har midlertidige problemer. Prøv igjen senere.';
      default:
        return 'En feil oppstod ved kommunikasjon med Spotify.';
    }
  }
}

export class NetworkError extends Error implements AppError {
  code = 'NETWORK_ERROR';
  userMessage = 'Nettverksfeil. Sjekk internettforbindelsen din.';
  isRetryable = true;

  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends Error implements AppError {
  code = 'VALIDATION_ERROR';
  userMessage = 'Ugyldig data. Vennligst sjekk inndataene.';
  isRetryable = false;

  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Handle and categorize errors
 */
export function handleError(error: unknown): AppError {
  if (error instanceof SpotifyAPIError || error instanceof NetworkError || error instanceof ValidationError) {
    return error;
  }

  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Failed to fetch')) {
      return new NetworkError(error.message);
    }

    // Generic error
    return {
      ...error,
      code: 'UNKNOWN_ERROR',
      userMessage: 'En uventet feil oppstod. Prøv igjen senere.',
      isRetryable: false
    } as AppError;
  }

  // Unknown error type
  const unknownError = new Error('Unknown error occurred');
  return {
    ...unknownError,
    code: 'UNKNOWN_ERROR',
    userMessage: 'En uventet feil oppstod. Prøv igjen senere.',
    isRetryable: false
  } as AppError;
}

/**
 * Log error with appropriate level
 */
export function logError(error: AppError, context?: string): void {
  const message = context ? `${context}: ${error.message}` : error.message;
  
  if (error.statusCode && error.statusCode >= 500) {
    logger.error(message, error);
  } else if (error.statusCode === 429) {
    logger.warn(message, error);
  } else {
    logger.error(message, error);
  }
}

/**
 * Create user-friendly error message
 */
export function getUserErrorMessage(error: AppError): string {
  return error.userMessage || 'En feil oppstod. Prøv igjen senere.';
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: AppError): boolean {
  return error.isRetryable || false;
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }

      const appError = handleError(error);
      if (!isRetryableError(appError)) {
        throw appError;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      logger.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms delay`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}
