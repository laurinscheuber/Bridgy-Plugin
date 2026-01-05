/**
 * Centralized error handling and logging utilities
 */

export interface ErrorContext {
  operation: string;
  component?: string;
  userId?: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class ErrorHandler {
  private static errorLog: Array<{ error: Error; context: ErrorContext }> = [];
  private static readonly MAX_ERROR_LOG_SIZE = 100;

  /**
   * Handle and log errors with context
   */
  static handleError(error: Error, context: Partial<ErrorContext>): void {
    const fullContext: ErrorContext = {
      operation: context.operation || 'unknown',
      component: context.component || 'unknown',
      timestamp: new Date().toISOString(),
      severity: context.severity || 'medium',
    };

    // Add to error log
    this.errorLog.push({ error, context: fullContext });

    // Trim log if too large
    if (this.errorLog.length > this.MAX_ERROR_LOG_SIZE) {
      this.errorLog.shift();
    }

    // Log to console with appropriate level
    switch (fullContext.severity) {
      case 'critical':
        console.error('CRITICAL ERROR:', error.message, fullContext);
        break;
      case 'high':
        console.error('HIGH SEVERITY:', error.message, fullContext);
        break;
      case 'medium':
        console.warn('MEDIUM SEVERITY:', error.message, fullContext);
        break;
      case 'low':
        console.log('LOW SEVERITY:', error.message, fullContext);
        break;
    }
  }

  /**
   * Create user-friendly error message
   */
  static getUserFriendlyMessage(error: Error, operation: string): string {
    const errorLower = error.message.toLowerCase();

    // Network errors
    if (errorLower.includes('network') || errorLower.includes('fetch')) {
      return `Unable to connect to GitLab. Please check your internet connection and GitLab server status.`;
    }

    // Authentication errors
    if (
      errorLower.includes('unauthorized') ||
      errorLower.includes('401') ||
      errorLower.includes('403')
    ) {
      return `Authentication failed. Please check your GitLab token and permissions in Settings.`;
    }

    // Validation errors
    if (errorLower.includes('invalid') || errorLower.includes('validation')) {
      return `Invalid input: ${error.message}`;
    }

    // Rate limiting
    if (errorLower.includes('rate limit') || errorLower.includes('429')) {
      return `Too many requests. Please wait a moment and try again.`;
    }

    // File operation errors
    if (operation.includes('export') || operation.includes('generate')) {
      return `Failed to ${operation}. Please try again or contact support if the issue persists.`;
    }

    // Generic fallback
    return `An error occurred during ${operation}. Please try again.`;
  }

  /**
   * Wrap async operations with error handling
   */
  static async withErrorHandling<T>(
    operation: () => Promise<T>,
    context: Partial<ErrorContext>,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      this.handleError(error as Error, context);
      throw error;
    }
  }

  /**
   * Sanitize error for UI display (remove sensitive info)
   */
  static sanitizeErrorForUI(error: Error): { message: string; type: string } {
    let message = this.getUserFriendlyMessage(error, 'operation');

    // Remove any potential sensitive information
    message = message
      .replace(/token[=:]\s*[a-zA-Z0-9_-]+/gi, 'token=***')
      .replace(/password[=:]\s*[^\s]+/gi, 'password=***')
      .replace(/key[=:]\s*[a-zA-Z0-9_-]+/gi, 'key=***');

    return {
      message,
      type: error.name || 'Error',
    };
  }

  /**
   * Get error statistics for monitoring
   */
  static getErrorStats(): {
    total: number;
    bySeverity: Record<string, number>;
    recent: Array<{ operation: string; timestamp: string; severity: string }>;
  } {
    const bySeverity = this.errorLog.reduce(
      (acc, { context }) => {
        acc[context.severity] = (acc[context.severity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const recent = this.errorLog.slice(-10).map(({ context }) => ({
      operation: context.operation,
      timestamp: context.timestamp,
      severity: context.severity,
    }));

    return {
      total: this.errorLog.length,
      bySeverity,
      recent,
    };
  }

  /**
   * Clear error log
   */
  static clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Show user-friendly error message in UI
   */
  static showUserError(error: Error, operation: string): void {
    const userMessage = this.getUserFriendlyMessage(error, operation);

    // Try to post message to UI if available
    if (typeof figma !== 'undefined' && figma.ui) {
      try {
        figma.ui.postMessage({
          type: 'show-error',
          title: 'Operation Failed',
          message: userMessage,
          operation: operation,
        });
      } catch (uiError) {
        console.error('Failed to show UI error:', uiError);
      }
    }

    // Log the error for debugging
    this.handleError(error, {
      operation,
      component: 'UI',
      severity: 'high',
    });
  }

  /**
   * Show success message in UI
   */
  static showUserSuccess(message: string, operation: string): void {
    if (typeof figma !== 'undefined' && figma.ui) {
      try {
        figma.ui.postMessage({
          type: 'show-success',
          title: 'Success',
          message: message,
          operation: operation,
        });
      } catch (uiError) {
        console.error('Failed to show UI success:', uiError);
      }
    }
  }

  /**
   * Wrap async operations with comprehensive error handling and UI feedback
   */
  static async withErrorHandlingAndUI<T>(
    operation: () => Promise<T>,
    context: Partial<ErrorContext>,
    showUIFeedback: boolean = true,
  ): Promise<T> {
    try {
      const result = await operation();

      if (showUIFeedback && context.operation) {
        this.showUserSuccess(`${context.operation} completed successfully`, context.operation);
      }

      return result;
    } catch (error) {
      this.handleError(error as Error, context);

      if (showUIFeedback && context.operation) {
        this.showUserError(error as Error, context.operation);
      }

      throw error;
    }
  }

  /**
   * Validate and sanitize user input to prevent errors
   */
  static validateInput(
    input: any,
    fieldName: string,
    rules: {
      required?: boolean;
      minLength?: number;
      maxLength?: number;
      pattern?: RegExp;
      type?: 'string' | 'number' | 'email' | 'url';
    },
  ): { isValid: boolean; error?: string } {
    if (rules.required && (input === null || input === undefined || input === '')) {
      return { isValid: false, error: `${fieldName} is required` };
    }

    if (input === null || input === undefined || input === '') {
      return { isValid: true }; // Optional field
    }

    const inputStr = String(input);

    if (rules.minLength && inputStr.length < rules.minLength) {
      return {
        isValid: false,
        error: `${fieldName} must be at least ${rules.minLength} characters`,
      };
    }

    if (rules.maxLength && inputStr.length > rules.maxLength) {
      return {
        isValid: false,
        error: `${fieldName} must be no more than ${rules.maxLength} characters`,
      };
    }

    if (rules.pattern && !rules.pattern.test(inputStr)) {
      return { isValid: false, error: `${fieldName} format is invalid` };
    }

    if (rules.type) {
      switch (rules.type) {
        case 'number':
          if (isNaN(Number(input))) {
            return { isValid: false, error: `${fieldName} must be a valid number` };
          }
          break;
        case 'email':
          const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailPattern.test(inputStr)) {
            return { isValid: false, error: `${fieldName} must be a valid email address` };
          }
          break;
        case 'url':
          try {
            new URL(inputStr);
          } catch {
            return { isValid: false, error: `${fieldName} must be a valid URL` };
          }
          break;
      }
    }

    return { isValid: true };
  }
}
