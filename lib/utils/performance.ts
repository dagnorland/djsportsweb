/**
 * Performance monitoring and logging utilities
 */

interface PerformanceLog {
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private logs: Map<string, PerformanceLog> = new Map();
  private completedLogs: PerformanceLog[] = [];

  /**
   * Start timing an operation
   */
  startTiming(operation: string, metadata?: Record<string, any>): string {
    const id = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.logs.set(id, {
      operation,
      startTime: performance.now(),
      metadata
    });
    
    return id;
  }

  /**
   * End timing an operation
   */
  endTiming(id: string): number | null {
    const log = this.logs.get(id);
    if (!log) {
      console.warn(`Performance log not found for id: ${id}`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - log.startTime;
    
    const completedLog: PerformanceLog = {
      ...log,
      endTime,
      duration
    };

    this.completedLogs.push(completedLog);
    this.logs.delete(id);

    // Log to console for development
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production') {
      const feedback = completedLog.metadata?.feedback ? ` ${completedLog.metadata.feedback}` : '';
      console.log(`⏱️ ${log.operation}: ${duration.toFixed(2)}ms${feedback}`, log.metadata);
    }

    return duration;
  }

  /**
   * Update metadata for an active log (before it's completed)
   */
  updateMetadata(id: string, metadata: Record<string, any>): void {
    const log = this.logs.get(id);
    if (log) {
      log.metadata = {
        ...log.metadata,
        ...metadata
      };
    }
  }

  /**
   * Update metadata for a completed log
   */
  updateCompletedLogMetadata(operation: string, trackUri: string, metadata: Record<string, any>): void {
    // Find the most recent completed log matching criteria
    const matchingLogs = this.completedLogs
      .filter(log => log.operation === operation && log.metadata?.trackUri === trackUri)
      .sort((a, b) => (b.endTime || 0) - (a.endTime || 0));
    
    if (matchingLogs.length > 0) {
      matchingLogs[0].metadata = {
        ...matchingLogs[0].metadata,
        ...metadata
      };
    }
  }

  /**
   * Get all completed logs
   */
  getLogs(): PerformanceLog[] {
    return [...this.completedLogs];
  }

  /**
   * Get logs for a specific operation
   */
  getLogsForOperation(operation: string): PerformanceLog[] {
    return this.completedLogs.filter(log => log.operation === operation);
  }

  /**
   * Get active (not yet completed) logs for a specific operation
   */
  getActiveLogsForOperation(operation: string): Array<{ id: string; log: PerformanceLog }> {
    const result: Array<{ id: string; log: PerformanceLog }> = [];
    this.logs.forEach((log, id) => {
      if (log.operation === operation) {
        result.push({ id, log });
      }
    });
    return result;
  }

  /**
   * Get average duration for an operation
   */
  getAverageDuration(operation: string): number {
    const logs = this.getLogsForOperation(operation);
    if (logs.length === 0) return 0;
    
    const total = logs.reduce((sum, log) => sum + (log.duration || 0), 0);
    return total / logs.length;
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.completedLogs = [];
    this.logs.clear();
  }

  /**
   * Get performance summary
   */
  getSummary(): Record<string, { count: number; avgDuration: number; totalDuration: number }> {
    const summary: Record<string, { count: number; avgDuration: number; totalDuration: number }> = {};
    
    this.completedLogs.forEach(log => {
      if (!summary[log.operation]) {
        summary[log.operation] = { count: 0, avgDuration: 0, totalDuration: 0 };
      }
      
      summary[log.operation].count++;
      summary[log.operation].totalDuration += log.duration || 0;
    });

    // Calculate averages
    Object.keys(summary).forEach(operation => {
      const stats = summary[operation];
      stats.avgDuration = stats.totalDuration / stats.count;
    });

    return summary;
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Higher-order function to time async operations
 */
export function withTiming<T extends any[], R>(
  operation: string,
  fn: (...args: T) => Promise<R>,
  metadata?: Record<string, any>
) {
  return async (...args: T): Promise<R> => {
    const id = performanceMonitor.startTiming(operation, metadata);
    try {
      const result = await fn(...args);
      performanceMonitor.endTiming(id);
      return result;
    } catch (error) {
      performanceMonitor.endTiming(id);
      throw error;
    }
  };
}

/**
 * Time a synchronous operation
 */
export function timeSync<T>(
  operation: string,
  fn: () => T,
  metadata?: Record<string, any>
): T {
  const id = performanceMonitor.startTiming(operation, metadata);
  try {
    const result = fn();
    performanceMonitor.endTiming(id);
    return result;
  } catch (error) {
    performanceMonitor.endTiming(id);
    throw error;
  }
}

/**
 * Track start time logging specifically for tracks
 */
export function logTrackStart(trackUri: string, startTime?: number, playlistId?: string) {
  const metadata = {
    trackUri,
    startTime,
    playlistId,
    timestamp: new Date().toISOString()
  };
  
  performanceMonitor.startTiming('track_start', metadata);
}

export function logTrackStartComplete(trackUri: string, success: boolean, error?: string) {
  const logs = performanceMonitor.getLogsForOperation('track_start');
  const latestLog = logs[logs.length - 1];
  
  if (latestLog && latestLog.metadata?.trackUri === trackUri) {
    const duration = performance.now() - latestLog.startTime;
    console.log(`🎵 Track started: ${trackUri} in ${duration.toFixed(2)}ms (success: ${success})`);
    
    if (error) {
      console.error(`❌ Track start error: ${error}`);
    }
  }
}
