/**
 * Monitoring service for error and performance tracking
 * Provides infrastructure for both development logs and production monitoring
 * Can be easily adapted to integrate with external monitoring services
 */

// Define types for better error handling
type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
type LogLevel = 'trace' | 'debug' | 'info' | 'warning' | 'error';

interface ErrorDetails {
  message: string;
  error: Error;
  severity?: ErrorSeverity;
  metadata?: Record<string, any>;
  tags?: string[];
  user?: {
    id?: string;
    // No longer storing email in logs for security
    [key: string]: any;
  };
}

interface LogDetails {
  message: string;
  level?: LogLevel;
  metadata?: Record<string, any>;
  tags?: string[];
}

// List of fields that should never be logged
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'secret',
  'key',
  'auth',
  'jwt',
  'email',
  'phone',
  'address',
  'name',
  'location',
  'ssn',
  'session',
  'personal',
  'credential',
  'accessToken',
  'refreshToken'
];

class EnhancedMonitoring {
  private isProduction = process.env.NODE_ENV === 'production';
  private sampleRate = 1.0; // 100% errors reported by default
  private currentLogLevel: LogLevel = this.isProduction ? 'error' : 'trace';
  
  // Log level hierarchy for comparison
  private logLevelHierarchy: Record<LogLevel, number> = {
    'trace': 0,
    'debug': 1,
    'info': 2,
    'warning': 3,
    'error': 4
  };
  
  /**
   * Sanitizes objects to remove sensitive information before logging
   */
  private sanitizeData(data: any): any {
    if (!data) return data;
    
    // For primitive types, return as is
    if (typeof data !== 'object') return data;
    
    // Handle arrays
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }
    
    // Handle objects
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(data)) {
      // Check if the key contains sensitive information
      const isSensitive = SENSITIVE_FIELDS.some(field => 
        key.toLowerCase().includes(field.toLowerCase())
      );
      
      if (isSensitive) {
        sanitized[key] = typeof value === 'string' ? '[REDACTED]' : '[REDACTED_OBJECT]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
  
  /**
   * Captures error details with additional context
   * In production, this would integrate with an error monitoring service
   */
  captureError(name: string, error: Error, metadata?: Record<string, any>, severity: ErrorSeverity = 'medium') {
    // Always log errors regardless of environment
    const sanitizedMetadata = this.sanitizeData(metadata);
    
    // In production: rate limit error reporting to avoid overwhelming systems
    if (this.isProduction && Math.random() > this.sampleRate) return;
    
    // Structured error data for eventual external service
    const errorData = {
      name,
      message: error.message,
      stack: this.isProduction ? undefined : error.stack, // Only include stack in development
      severity,
      metadata: {
        ...sanitizedMetadata,
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
      // Example: Sentry.captureException(error, { extra: sanitizedMetadata });
    } else {
      console.error(`[Error] ${name}: ${error.message}`, { 
        metadata: sanitizedMetadata, 
        stack: error.stack 
      });
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
    // Only log if the current log level is less than or equal to the message level
    if (this.logLevelHierarchy[level] >= this.logLevelHierarchy[this.currentLogLevel]) {
      const sanitizedMetadata = this.sanitizeData(metadata);
      
      const logFn = level === 'error' ? console.error : 
                   level === 'warning' ? console.warn : 
                   level === 'info' ? console.info :
                   console.log;
      
      logFn(`[${level}] ${message}`, { 
        metadata: sanitizedMetadata, 
        tags, 
        timestamp: new Date().toISOString() 
      });
    }
  }
  
  /**
   * Set the current log level
   */
  setLogLevel(level: LogLevel) {
    this.currentLogLevel = level;
  }
  
  /**
   * Get the current log level
   */
  getLogLevel(): LogLevel {
    return this.currentLogLevel;
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
  
  /**
   * Initialize the monitoring service
   * Sets appropriate log level based on environment
   */
  initialize() {
    // Set log level based on environment
    if (this.isProduction) {
      this.setLogLevel('error');
    } else {
      this.setLogLevel('trace');
    }
    
    // Log initialization status
    this.log({
      message: `Monitoring initialized in ${this.isProduction ? 'production' : 'development'} mode with log level ${this.currentLogLevel}`,
      level: 'info'
    });
  }
}

// Export a singleton instance
export const monitoring = new EnhancedMonitoring();

// Initialize monitoring with appropriate settings
monitoring.initialize(); 