/**
 * Monitoring service for error and performance tracking
 * Provides infrastructure for both development logs and production monitoring
 * Can be easily adapted to integrate with external monitoring services
 */

// Define types for better error handling
type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
type LogLevel = 'debug' | 'info' | 'warning' | 'error';

interface ErrorDetails {
  message: string;
  error: Error;
  severity?: ErrorSeverity;
  metadata?: Record<string, any>;
  tags?: string[];
  user?: {
    id?: string;
    email?: string;
    [key: string]: any;
  };
}

interface LogDetails {
  message: string;
  level?: LogLevel;
  metadata?: Record<string, any>;
  tags?: string[];
}

class EnhancedMonitoring {
  private isProduction = process.env.NODE_ENV === 'production';
  private sampleRate = 1.0; // 100% errors reported by default
  
  /**
   * Captures error details with additional context
   * In production, this would integrate with an error monitoring service
   */
  captureError(name: string, error: Error, metadata?: Record<string, any>, severity: ErrorSeverity = 'medium') {
    // Always log to console in development
    if (!this.isProduction) {
      console.error(`[Error] ${name}: ${error.message}`, { metadata, stack: error.stack });
      return;
    }
    
    // In production: rate limit error reporting to avoid overwhelming systems
    if (Math.random() > this.sampleRate) return;
    
    // Structured error data for eventual external service
    const errorData = {
      name,
      message: error.message,
      stack: error.stack,
      severity,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : 'server',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      }
    };
    
    // In production, we'd send to an external service
    // This is where you'd integrate Sentry, LogRocket, etc.
    if (this.isProduction) {
      // For now just log to console, but in real production would send to a service
      console.error(JSON.stringify(errorData));
      
      // Placeholder for external service integration
      // Example: Sentry.captureException(error, { extra: metadata });
    }
  }
  
  /**
   * Legacy method - alias for captureError for backwards compatibility
   */
  logError({ message, error, metadata, severity = 'medium' }: ErrorDetails) {
    this.captureError(message, error, metadata, severity);
  }
  
  /**
   * Log general information with structured format
   */
  log({ message, level = 'info', metadata, tags = [] }: LogDetails) {
    if (!this.isProduction || level === 'error' || level === 'warning') {
      const logFn = level === 'error' ? console.error : 
                    level === 'warning' ? console.warn : console.log;
      
      logFn(`[${level}] ${message}`, { metadata, tags, timestamp: new Date().toISOString() });
    }
  }
  
  /**
   * Measure and report function execution time
   */
  async timeExecution<T>(name: string, fn: () => Promise<T> | T, options: { threshold?: number } = {}): Promise<T> {
    const startTime = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      
      // Only log if exceeds threshold or in development
      const { threshold = 0 } = options;
      if (!this.isProduction || duration > threshold) {
        this.log({ 
          message: `${name} completed in ${duration.toFixed(2)}ms`,
          level: duration > 1000 ? 'warning' : 'info',
          metadata: { duration, threshold },
          tags: ['performance']
        });
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.logError({ 
        message: `${name} failed after ${duration.toFixed(2)}ms`, 
        error: error as Error,
        metadata: { duration },
        severity: 'high'
      });
      throw error;
    }
  }
  
  /**
   * Sets the sample rate for error reporting in production
   * Useful for high-traffic apps to limit error volume
   */
  setSampleRate(rate: number) {
    this.sampleRate = Math.max(0, Math.min(1, rate));
  }
}

// Export a singleton instance
export const monitoring = new EnhancedMonitoring(); 