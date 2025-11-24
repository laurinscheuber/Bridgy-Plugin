// Logging levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

// Log entry interface
export interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: Date;
  category?: string;
}

export class LoggingService {
  private static currentLevel: LogLevel = LogLevel.INFO;
  private static logs: LogEntry[] = [];
  private static maxLogs = 1000; // Keep last 1000 log entries
  
  // Categories for different parts of the system
  static readonly CATEGORIES = {
    COMPONENT: 'Component',
    GITLAB: 'GitLab',
    GITHUB: 'GitHub',
    CSS_EXPORT: 'CSS Export', 
    UNITS: 'Units',
    UI: 'UI',
    CORE: 'Core',
    TESTING: 'Testing'
  } as const;

  /**
   * Set the current logging level
   */
  static setLogLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  // TODO: is this method used anywhere?
  /**
   * Get the current logging level
   */
  static getLogLevel(): LogLevel {
    return this.currentLevel;
  }

  /**
   * Check if a log level should be output
   */
  private static shouldLog(level: LogLevel): boolean {
    return level >= this.currentLevel;
  }

  /**
   * Add a log entry to the internal log storage
   */
  private static addLogEntry(level: LogLevel, message: string, data?: any, category?: string): void {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date(),
      category
    };

    this.logs.push(entry);

    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  /**
   * Debug level logging
   */
  static debug(message: string, data?: any, category?: string): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    this.addLogEntry(LogLevel.DEBUG, message, data, category);
    console.debug(`[DEBUG]${category ? ` [${category}]` : ''} ${message}`, data || '');
  }

  // TODO: is this method used anywhere?
  /**
   * Info level logging  
   */
  static info(message: string, data?: any, category?: string): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    this.addLogEntry(LogLevel.INFO, message, data, category);
    console.info(`[INFO]${category ? ` [${category}]` : ''} ${message}`, data || '');
  }

  /**
   * Warning level logging
   */
  static warn(message: string, data?: any, category?: string): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    this.addLogEntry(LogLevel.WARN, message, data, category);
    console.warn(`[WARN]${category ? ` [${category}]` : ''} ${message}`, data || '');
  }

  /**
   * Error level logging
   */
  static error(message: string, error?: any, category?: string): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    this.addLogEntry(LogLevel.ERROR, message, error, category);
    console.error(`[ERROR]${category ? ` [${category}]` : ''} ${message}`, error || '');
  }

  // TODO: all the methods below seem not used anywhere
  /**
   * Get all log entries
   */
  static getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Get log entries by level
   */
  static getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Get log entries by category
   */
  static getLogsByCategory(category: string): LogEntry[] {
    return this.logs.filter(log => log.category === category);
  }

  /**
   * Clear all log entries
   */
  static clearLogs(): void {
    this.logs = [];
  }

  /**
   * Get log summary (counts by level)
   */
  static getLogsSummary(): Record<string, number> {
    const summary = {
      debug: 0,
      info: 0,
      warn: 0,
      error: 0
    };

    this.logs.forEach(log => {
      switch (log.level) {
        case LogLevel.DEBUG:
          summary.debug++;
          break;
        case LogLevel.INFO:
          summary.info++;
          break;
        case LogLevel.WARN:
          summary.warn++;
          break;
        case LogLevel.ERROR:
          summary.error++;
          break;
      }
    });

    return summary;
  }

  /**
   * Export logs as JSON string
   */
  static exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Format log entry for display
   */
  static formatLogEntry(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = LogLevel[entry.level];
    const category = entry.category ? ` [${entry.category}]` : '';
    const data = entry.data ? ` | ${JSON.stringify(entry.data)}` : '';
    
    return `${timestamp} [${level}]${category} ${entry.message}${data}`;
  }

  /**
   * Performance timing helper
   */
  static time(label: string, category?: string): () => void {
    const start = performance.now();
    this.debug(`Timer started: ${label}`, undefined, category);
    
    return () => {
      const duration = performance.now() - start;
      this.debug(`Timer finished: ${label} (${duration.toFixed(2)}ms)`, { duration }, category);
    };
  }

  /**
   * Log with performance measurement
   */
  static withTiming<T>(operation: () => T, label: string, category?: string): T {
    const endTimer = this.time(label, category);
    try {
      const result = operation();
      endTimer();
      return result;
    } catch (error) {
      endTimer();
      this.error(`Error in ${label}:`, error, category);
      throw error;
    }
  }

  /**
   * Log with performance measurement for async operations
   */
  static async withTimingAsync<T>(operation: () => Promise<T>, label: string, category?: string): Promise<T> {
    const endTimer = this.time(label, category);
    try {
      const result = await operation();
      endTimer();
      return result;
    } catch (error) {
      endTimer();
      this.error(`Error in ${label}:`, error, category);
      throw error;
    }
  }
}