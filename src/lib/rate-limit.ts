interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

export interface RateLimitConfig {
  limit: number
  windowMs: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  retryAfter?: number
}

export function createRateLimiter(config: RateLimitConfig) {
  return {
    check: (key: string): RateLimitResult => checkRateLimit(key, config),
  }
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const existing = store.get(key)

  if (!existing || now > existing.resetAt) {
    const resetAt = now + config.windowMs
    store.set(key, { count: 1, resetAt })

    return {
      allowed: true,
      remaining: Math.max(0, config.limit - 1),
      resetAt,
    }
  }

  if (existing.count >= config.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfter: Math.max(0, Math.ceil((existing.resetAt - now) / 1000)),
    }
  }

  existing.count += 1

  return {
    allowed: true,
    remaining: Math.max(0, config.limit - existing.count),
    resetAt: existing.resetAt,
  }
}
