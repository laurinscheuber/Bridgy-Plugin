// Logging levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
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
    TESTING: 'Testing',
  } as const;

  /**
   * Set the current logging level
   */
  static setLogLevel(level: LogLevel): void {
    this.currentLevel = level;
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
  private static addLogEntry(
    level: LogLevel,
    message: string,
    data?: any,
    category?: string,
  ): void {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date(),
      category,
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
    console.error(`[ERROR]${category ? ` [${category}]` : ''} ${message}`, error || '');
  }
}


