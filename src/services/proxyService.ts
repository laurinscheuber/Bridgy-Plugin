/**
 * Proxy Service for GitLab API requests
 * Allows connecting to any GitLab instance via a proxy server,
 * bypassing Figma's manifest domain restrictions
 */

import { ErrorHandler } from '../utils/errorHandler';

interface ProxyRequest {
  targetUrl: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
}

interface ProxyResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
}

export class ProxyService {
  // TODO: Set this to your actual proxy server URL
  private static readonly PROXY_BASE_URL = 'https://api.bridgy-plugin.com/proxy';
  private static readonly USE_PROXY = false; // Set to true when proxy is ready

  /**
   * Check if a domain is likely to be in the manifest
   * This is a heuristic check - actual validation happens at runtime
   */
  static isDomainLikelyAllowed(domain: string): boolean {
    const commonPatterns = [
      'gitlab.com',
      'gitlab.io',
      'gitlab.fhnw.ch',
      'gitlab.de',
      'gitlab.ch',
      'gitlab.fr',
      'gitlab.org',
      'gitlab.net',
      'gitlab.edu',
      'gitlab.gov',
      'gitlab.uk',
      'gitlab.eu',
    ];

    return commonPatterns.some(pattern => 
      domain === pattern || domain.endsWith(`.${pattern}`)
    );
  }

  /**
   * Validate that a URL is a valid GitLab URL
   */
  static isValidGitLabUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      
      // Must be HTTPS
      if (parsed.protocol !== 'https:') {
        return false;
      }

      // Basic domain validation
      if (!parsed.hostname || parsed.hostname.length < 3) {
        return false;
      }

      // Check for common GitLab patterns or allow any domain (for self-hosted)
      const hostname = parsed.hostname.toLowerCase();
      const gitlabPatterns = [
        /gitlab/i,
        /\.git\./i,
        /\.code\./i,
        /\.scm\./i,
        /\.repo\./i,
        /\.vcs\./i,
      ];

      // Allow if it matches a pattern OR if we're using proxy (for flexibility)
      return gitlabPatterns.some(pattern => pattern.test(hostname)) || this.USE_PROXY;
    } catch {
      return false;
    }
  }

  /**
   * Proxy a GitLab API request through the proxy server
   */
  static async proxyGitLabRequest(
    targetUrl: string,
    options: RequestInit
  ): Promise<Response> {
    return await ErrorHandler.withErrorHandling(async () => {
      // Validate URL
      if (!this.isValidGitLabUrl(targetUrl)) {
        throw new Error('Invalid GitLab URL');
      }

      // Prepare proxy request
      const proxyRequest: ProxyRequest = {
        targetUrl,
        method: options.method || 'GET',
        headers: this.extractHeaders(options.headers),
        body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined,
      };

      // Make request to proxy
      const response = await fetch(this.PROXY_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(proxyRequest),
      });

      if (!response.ok) {
        throw new Error(`Proxy error: ${response.status} ${response.statusText}`);
      }

      // Parse proxy response
      const proxyResponse: ProxyResponse = await response.json();

      // Create a Response-like object
      return new Response(proxyResponse.body, {
        status: proxyResponse.status,
        statusText: proxyResponse.statusText,
        headers: new Headers(proxyResponse.headers),
      });
    }, {
      operation: 'proxy_gitlab_request',
      component: 'ProxyService',
      severity: 'high'
    });
  }

  /**
   * Extract headers from RequestInit
   */
  private static extractHeaders(headers?: HeadersInit): Record<string, string> {
    const result: Record<string, string> = {};

    if (!headers) {
      return result;
    }

    if (headers instanceof Headers) {
      headers.forEach((value, key) => {
        result[key] = value;
      });
    } else if (Array.isArray(headers)) {
      headers.forEach(([key, value]) => {
        result[key] = value;
      });
    } else {
      Object.assign(result, headers);
    }

    return result;
  }

  /**
   * Check if proxy should be used for a given URL
   */
  static shouldUseProxy(url: string): boolean {
    if (!this.USE_PROXY) {
      return false;
    }

    try {
      const parsed = new URL(url);
      const domain = parsed.hostname;

      // Use proxy if domain is not in the common allowed list
      return !this.isDomainLikelyAllowed(domain);
    } catch {
      return false;
    }
  }
}

