import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { checkRateLimit, createRateLimiter } from "./rate-limit"

describe("Rate Limiter", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("allows requests under the limit", () => {
    const limiter = createRateLimiter({ limit: 3, windowMs: 60_000 })

    expect(limiter.check("auth:ip-1").allowed).toBe(true)
    expect(limiter.check("auth:ip-1").allowed).toBe(true)
    expect(limiter.check("auth:ip-1").allowed).toBe(true)
  })

  it("blocks requests over the limit", () => {
    const config = { limit: 2, windowMs: 60_000 }

    expect(checkRateLimit("auth:ip-2", config).allowed).toBe(true)
    expect(checkRateLimit("auth:ip-2", config).allowed).toBe(true)
    expect(checkRateLimit("auth:ip-2", config).allowed).toBe(false)
  })

  it("resets after the window expires", () => {
    const config = { limit: 1, windowMs: 1_000 }

    expect(checkRateLimit("auth:ip-3", config).allowed).toBe(true)
    expect(checkRateLimit("auth:ip-3", config).allowed).toBe(false)

    vi.advanceTimersByTime(1_001)

    const result = checkRateLimit("auth:ip-3", config)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(0)
  })

  it("tracks different IPs separately", () => {
    const config = { limit: 1, windowMs: 60_000 }

    expect(checkRateLimit("auth:ip-4", config).allowed).toBe(true)
    expect(checkRateLimit("auth:ip-5", config).allowed).toBe(true)
    expect(checkRateLimit("auth:ip-4", config).allowed).toBe(false)
    expect(checkRateLimit("auth:ip-5", config).allowed).toBe(false)
  })

  it("returns remaining count", () => {
    const config = { limit: 3, windowMs: 60_000 }

    expect(checkRateLimit("auth:ip-6", config).remaining).toBe(2)
    expect(checkRateLimit("auth:ip-6", config).remaining).toBe(1)
    expect(checkRateLimit("auth:ip-6", config).remaining).toBe(0)
  })

  it("returns retry-after when blocked", () => {
    const config = { limit: 1, windowMs: 10_000 }

    expect(checkRateLimit("auth:ip-7", config).allowed).toBe(true)

    vi.advanceTimersByTime(2_000)
    const blocked = checkRateLimit("auth:ip-7", config)

    expect(blocked.allowed).toBe(false)
    expect(blocked.retryAfter).toBe(8)
  })
})
