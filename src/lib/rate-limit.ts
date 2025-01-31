import { NextResponse } from "next/server";

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const defaultConfig: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 60 * 60 * 1000, // 1 hour
};

const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimiter(
  userId: string,
  config: Partial<RateLimitConfig> = {}
): NextResponse | null {
  const { maxRequests, windowMs } = { ...defaultConfig, ...config };
  const now = Date.now();

  // Get or create user's rate limit data
  let userData = requestCounts.get(userId);
  if (!userData || now > userData.resetTime) {
    userData = {
      count: 0,
      resetTime: now + windowMs,
    };
    requestCounts.set(userId, userData);
  }

  // Increment request count
  userData.count++;

  // Check if rate limit exceeded
  if (userData.count > maxRequests) {
    const resetIn = Math.ceil((userData.resetTime - now) / 1000);
    return new NextResponse(
      JSON.stringify({
        error: "Rate limit exceeded",
        resetIn: `${resetIn} seconds`,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": maxRequests.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": Math.ceil(userData.resetTime / 1000).toString(),
          "Retry-After": resetIn.toString(),
        },
      }
    );
  }

  return null;
}

// Clean up old rate limit data periodically
setInterval(() => {
  const now = Date.now();
  for (const [userId, userData] of requestCounts.entries()) {
    if (now > userData.resetTime) {
      requestCounts.delete(userId);
    }
  }
}, 60 * 1000); // Clean up every minute
