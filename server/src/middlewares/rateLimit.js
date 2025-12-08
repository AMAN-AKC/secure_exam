/**
 * Simple in-memory rate limiting middleware
 * Tracks requests by IP address
 */

class RateLimitStore {
  constructor() {
    this.requests = new Map();
    this.cleanup();
  }

  cleanup() {
    // Clean up old entries every minute
    setInterval(() => {
      const now = Date.now();
      for (const [key, data] of this.requests.entries()) {
        // Remove entries older than 1 hour
        if (now - data.createdAt > 60 * 60 * 1000) {
          this.requests.delete(key);
        }
      }
    }, 60000);
  }

  increment(key) {
    const now = Date.now();
    if (!this.requests.has(key)) {
      this.requests.set(key, { count: 1, createdAt: now, windowStart: now });
      return { count: 1, remaining: 99 };
    }

    const data = this.requests.get(key);
    data.count++;
    return { count: data.count, remaining: Math.max(0, 100 - data.count) };
  }

  reset(key) {
    this.requests.delete(key);
  }
}

const store = new RateLimitStore();

/**
 * Create rate limit middleware for auth endpoints
 * @param {number} maxRequests - Max requests allowed
 * @param {number} windowMs - Time window in milliseconds
 */
export const createRateLimit = (maxRequests = 5, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const key = `${ip}:${req.path}`;

    // Get current request count
    const now = Date.now();
    if (!store.requests.has(key)) {
      store.requests.set(key, { count: 1, createdAt: now, windowStart: now });
      return next();
    }

    const data = store.requests.get(key);
    const windowElapsed = now - data.windowStart;

    // Reset if outside window
    if (windowElapsed > windowMs) {
      store.reset(key);
      store.requests.set(key, { count: 1, createdAt: now, windowStart: now });
      return next();
    }

    // Check if limit exceeded
    if (data.count >= maxRequests) {
      const retryAfter = Math.ceil((windowMs - windowElapsed) / 1000);
      return res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
        retryAfter
      });
    }

    data.count++;
    res.set('X-RateLimit-Limit', maxRequests);
    res.set('X-RateLimit-Remaining', Math.max(0, maxRequests - data.count));
    res.set('X-RateLimit-Reset', new Date(data.windowStart + windowMs).toISOString());

    next();
  };
};

/**
 * Strict rate limit for login attempts (5 per 15 minutes)
 */
export const loginRateLimit = createRateLimit(5, 15 * 60 * 1000);

/**
 * Strict rate limit for registration (3 per hour)
 */
export const registerRateLimit = createRateLimit(3, 60 * 60 * 1000);

/**
 * Moderate rate limit for OTP send (5 per 30 minutes)
 */
export const otpSendRateLimit = createRateLimit(5, 30 * 60 * 1000);

/**
 * Strict rate limit for OTP verify (10 attempts per 30 minutes)
 */
export const otpVerifyRateLimit = createRateLimit(10, 30 * 60 * 1000);
