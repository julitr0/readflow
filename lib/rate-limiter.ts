interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private requests = new Map<string, RateLimitEntry>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 10, windowMinutes: number = 15) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMinutes * 60 * 1000;
  }

  /**
   * Check if request is allowed for given identifier (email, IP, etc.)
   */
  isAllowed(identifier: string): {
    allowed: boolean;
    remainingRequests: number;
    resetTime: number;
  } {
    const now = Date.now();
    const entry = this.requests.get(identifier);

    // Clean up expired entries periodically
    this.cleanup(now);

    if (!entry || now >= entry.resetTime) {
      // First request or window has reset
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return {
        allowed: true,
        remainingRequests: this.maxRequests - 1,
        resetTime: now + this.windowMs,
      };
    }

    if (entry.count >= this.maxRequests) {
      // Rate limit exceeded
      return {
        allowed: false,
        remainingRequests: 0,
        resetTime: entry.resetTime,
      };
    }

    // Increment count
    entry.count++;
    this.requests.set(identifier, entry);

    return {
      allowed: true,
      remainingRequests: this.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  /**
   * Get current status for identifier
   */
  getStatus(identifier: string): {
    remainingRequests: number;
    resetTime: number;
  } {
    const now = Date.now();
    const entry = this.requests.get(identifier);

    if (!entry || now >= entry.resetTime) {
      return {
        remainingRequests: this.maxRequests,
        resetTime: now + this.windowMs,
      };
    }

    return {
      remainingRequests: Math.max(0, this.maxRequests - entry.count),
      resetTime: entry.resetTime,
    };
  }

  /**
   * Clean up expired entries to prevent memory leaks
   */
  private cleanup(now: number): void {
    if (this.requests.size > 10000) {
      // Clean up when we have too many entries
      for (const [key, entry] of this.requests.entries()) {
        if (now >= entry.resetTime) {
          this.requests.delete(key);
        }
      }
    }
  }

  /**
   * Reset rate limit for identifier (admin use)
   */
  reset(identifier: string): void {
    this.requests.delete(identifier);
  }
}

// RF-16: Rate limiting for email processing to prevent abuse
// 10 conversions per 15 minutes per email address
export const emailProcessingRateLimit = new RateLimiter(10, 15);

// More restrictive rate limiting for unauthenticated requests (by IP)
export const ipRateLimit = new RateLimiter(5, 60); // 5 requests per hour

export { RateLimiter };
