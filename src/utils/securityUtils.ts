/**
 * Security utilities for safe HTML rendering and input sanitization
 */

export class SecurityUtils {
  /**
   * Sanitize HTML content to prevent XSS attacks
   * @param htmlString Raw HTML string
   * @returns Sanitized HTML string
   */
  static sanitizeHTML(htmlString: string): string {
    if (typeof htmlString !== 'string') {
      return '';
    }

    // Remove script tags and event handlers
    let sanitized = htmlString
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/on\w+\s*=\s*[^>\s]+/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/data:/gi, '');

    // Allow only safe HTML tags
    const allowedTags = [
      'p', 'br', 'strong', 'em', 'b', 'i', 'u', 'span', 'div',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li',
      'code', 'pre', 'blockquote', 'select', 'option', 'button', 
      'svg', 'path', 'circle'
    ];

    // Remove any tags not in allowlist
    sanitized = sanitized.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g, (match, tagName) => {
      const lowerTagName = tagName.toLowerCase();
      return allowedTags.indexOf(lowerTagName) !== -1 ? match : '';
    });

    return sanitized;
  }

  /**
   * Create safe DOM element with text content (prevents XSS)
   * @param tagName HTML tag name
   * @param textContent Safe text content
   * @param className Optional CSS class
   * @returns HTML string
   */
  static createSafeElement(tagName: string, textContent: string, className?: string): string {
    const escapedText = this.escapeHTML(textContent);
    const classAttr = className ? ` class="${this.escapeHTML(className)}"` : '';
    return `<${tagName}${classAttr}>${escapedText}</${tagName}>`;
  }

  /**
   * Escape HTML entities to prevent XSS
   * @param text Raw text
   * @returns Escaped text
   */
  static escapeHTML(text: string): string {
    if (typeof text !== 'string') {
      return '';
    }

    const htmlEscapes: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };

    return text.replace(/[&<>"'/]/g, (match) => htmlEscapes[match]);
  }

  /**
   * Validate and sanitize user input
   * @param input User input
   * @param maxLength Maximum allowed length
   * @returns Sanitized input
   */
  static sanitizeInput(input: string, maxLength: number = 1000): string {
    if (typeof input !== 'string') {
      return '';
    }

    // Remove control characters and normalize whitespace
    let sanitized = input
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Truncate if too long
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
  }

  /**
   * Validate GitLab URL format
   * @param url GitLab URL
   * @returns true if valid GitLab URL
   */
  static isValidGitLabURL(url: string): boolean {
    if (typeof url !== 'string') {
      return false;
    }

    try {
      const parsedUrl = new URL(url);
      
      // Must be HTTPS
      if (parsedUrl.protocol !== 'https:') {
        return false;
      }

      // Check for common GitLab patterns
      const gitlabPatterns = [
        /^gitlab\.com$/,
        /^.*\.gitlab\.com$/,
        /^.*\.gitlab\.io$/,
        /gitlab/i // Allow custom GitLab instances with "gitlab" in domain
      ];

      return gitlabPatterns.some(pattern => pattern.test(parsedUrl.hostname));
    } catch {
      return false;
    }
  }

  /**
   * Rate limiting for API calls
   */
  private static rateLimitCache = new Map<string, { count: number; resetTime: number }>();

  static checkRateLimit(key: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;

    const current = this.rateLimitCache.get(key);
    
    if (!current || current.resetTime < windowStart) {
      this.rateLimitCache.set(key, { count: 1, resetTime: now });
      return true;
    }

    if (current.count >= maxRequests) {
      return false; // Rate limit exceeded
    }

    current.count++;
    return true;
  }

  /**
   * Simple encryption for sensitive data storage
   * @param data Data to encrypt
   * @param key Encryption key
   * @returns Encrypted string
   */
  static encryptData(data: string, key: string): string {
    if (typeof data !== 'string' || typeof key !== 'string') {
      throw new Error('Data and key must be strings');
    }

    // Simple XOR encryption for basic obfuscation
    // Note: This is not cryptographically secure but provides basic protection
    const keyBytes = new TextEncoder().encode(key);
    const dataBytes = new TextEncoder().encode(data);
    const encrypted = new Uint8Array(dataBytes.length);

    for (let i = 0; i < dataBytes.length; i++) {
      encrypted[i] = dataBytes[i] ^ keyBytes[i % keyBytes.length];
    }

    // Convert to base64 for storage
    return btoa(String.fromCharCode(...encrypted));
  }

  /**
   * Decrypt data encrypted with encryptData
   * @param encryptedData Encrypted data string
   * @param key Decryption key
   * @returns Decrypted string
   */
  static decryptData(encryptedData: string, key: string): string {
    if (typeof encryptedData !== 'string' || typeof key !== 'string') {
      throw new Error('Encrypted data and key must be strings');
    }

    try {
      // Decode from base64
      const encrypted = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );

      const keyBytes = new TextEncoder().encode(key);
      const decrypted = new Uint8Array(encrypted.length);

      for (let i = 0; i < encrypted.length; i++) {
        decrypted[i] = encrypted[i] ^ keyBytes[i % keyBytes.length];
      }

      return new TextDecoder().decode(decrypted);
    } catch (error) {
      throw new Error('Failed to decrypt data - invalid format or key');
    }
  }

  /**
   * Generate a simple key for encryption based on session/user
   * @returns Encryption key
   */
  static generateEncryptionKey(): string {
    // Use figma file ID + timestamp as key components
    const fileId = (globalThis as any).figma?.root?.id || 'default';
    const userAgent = navigator.userAgent;
    const timestamp = Math.floor(Date.now() / (1000 * 60 * 60 * 24)); // Daily rotation
    
    return btoa(`${fileId}:${userAgent.slice(0, 20)}:${timestamp}`).slice(0, 32);
  }
}