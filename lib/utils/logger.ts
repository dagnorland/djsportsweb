/**
 * Centralized logging utility with environment-based log levels
 */

const isDev = process.env.NODE_ENV !== 'production';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

class Logger {
  private logLevel: LogLevel;

  constructor() {
    this.logLevel = isDev ? LogLevel.DEBUG : LogLevel.ERROR;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${message}`;
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage('ERROR', message), ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('WARN', message), ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage('INFO', message), ...args);
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage('DEBUG', message), ...args);
    }
  }

  // Specialized loggers for different domains
  spotify(message: string, ...args: any[]): void {
    this.debug(`🎵 [Spotify] ${message}`, ...args);
  }

  performance(message: string, ...args: any[]): void {
    this.debug(`⚡ [Performance] ${message}`, ...args);
  }

  auth(message: string, ...args: any[]): void {
    this.debug(`🔐 [Auth] ${message}`, ...args);
  }

  cache(message: string, ...args: any[]): void {
    this.debug(`💾 [Cache] ${message}`, ...args);
  }
}

export const logger = new Logger();
