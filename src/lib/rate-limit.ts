import { getRedis } from './redis'

// In-memory fallback if Redis is temporarily unreachable
const memoryStore = new Map<string, { count: number; resetAt: number }>()

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetInSeconds: number
}

/**
 * Enforces rate limiting per identifier using Redis with in-memory fallback.
 * Uses atomic INCR + EXPIRE.
 *
 * @param key Redis key prefix + identifier (e.g. "register:ip:127.0.0.1")
 * @param maxRequests Maximum allowed attempts in the window
 * @param windowSeconds Duration of the rate limit window in seconds
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const prefixedKey = `ratelimit:${key}`
  const now = Date.now()

  try {
    const redis = await getRedis()

    if (redis && redis.isOpen) {
      const current = await redis.incr(prefixedKey)

      if (current === 1) {
        // Set expiry on first hit
        await redis.expire(prefixedKey, windowSeconds)
      }

      let ttl = await redis.ttl(prefixedKey)
      if (ttl < 0) {
        ttl = windowSeconds
        await redis.expire(prefixedKey, windowSeconds)
      }

      const remaining = Math.max(0, maxRequests - current)

      return {
        success: current <= maxRequests,
        limit: maxRequests,
        remaining,
        resetInSeconds: ttl,
      }
    }
  } catch (error) {
    console.warn(
      '[RateLimit] Redis check failed, using in-memory fallback:',
      (error as Error).message
    )
  }

  // Fallback: In-memory rate limiting
  const record = memoryStore.get(prefixedKey)

  if (!record || record.resetAt <= now) {
    memoryStore.set(prefixedKey, {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    })
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      resetInSeconds: windowSeconds,
    }
  }

  record.count += 1
  const remainingSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000))
  const remaining = Math.max(0, maxRequests - record.count)

  return {
    success: record.count <= maxRequests,
    limit: maxRequests,
    remaining,
    resetInSeconds: remainingSeconds,
  }
}
