import 'server-only'
import { getRedis } from './redis'
import { checkRateLimit } from './rate-limit'

// ─────────────────────────────────────────────────────────────────────────────
// Constants & Configuration
// ─────────────────────────────────────────────────────────────────────────────

export const LOGIN_SECURITY_CONFIG = {
  /** Max failed attempts before account lockout */
  LOCKOUT_THRESHOLD: 5,
  /** Duration of lockout in seconds (15 minutes) */
  LOCKOUT_DURATION_SECONDS: 900,
  /** Max login requests per IP within window (10 attempts / 15 mins) */
  RATE_LIMIT_IP_MAX: 10,
  RATE_LIMIT_IP_WINDOW: 900,
  /** Max login requests per Email within window (5 attempts / 15 mins) */
  RATE_LIMIT_EMAIL_MAX: 5,
  RATE_LIMIT_EMAIL_WINDOW: 900,
  /** Progressive delay array in milliseconds based on fail count */
  PROGRESSIVE_DELAYS: [0, 0, 500, 1000, 2000, 4000, 5000] as const,
} as const

// ─────────────────────────────────────────────────────────────────────────────
// In-memory fallback stores (used when Redis is unavailable)
// ─────────────────────────────────────────────────────────────────────────────

const failCountMemoryStore = new Map<
  string,
  { count: number; resetAt: number }
>()

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extracts the real client IP from incoming request or request headers.
 */
export function extractClientIp(req?: unknown): string {
  try {
    if (req && typeof req === 'object') {
      const maybeReq = req as {
        headers?: Headers | Record<string, string | string[] | undefined>
      }
      if (maybeReq.headers) {
        if (typeof (maybeReq.headers as Headers).get === 'function') {
          const forwarded = (maybeReq.headers as Headers).get('x-forwarded-for')
          if (forwarded) return forwarded.split(',')[0].trim()
          const realIp = (maybeReq.headers as Headers).get('x-real-ip')
          if (realIp) return realIp.trim()
        } else if (typeof maybeReq.headers === 'object') {
          const headersObj = maybeReq.headers as Record<
            string,
            string | string[] | undefined
          >
          const forwarded = headersObj['x-forwarded-for']
          if (forwarded) {
            const forwardedStr = Array.isArray(forwarded)
              ? forwarded[0]
              : forwarded
            return forwardedStr.split(',')[0].trim()
          }
          const realIp = headersObj['x-real-ip']
          if (realIp) {
            return (Array.isArray(realIp) ? realIp[0] : realIp).trim()
          }
        }
      }
    }
  } catch {
    // Graceful fallback
  }
  return '127.0.0.1'
}

/**
 * Checks dual-layer login rate limiting (IP and Email).
 */
export async function checkLoginRateLimit(
  ip: string,
  email: string
): Promise<{
  blocked: boolean
  reason: 'ip' | 'email' | null
  retryAfterSeconds: number
}> {
  // 1. IP rate limit check
  const ipResult = await checkRateLimit(
    `login:ip:${ip}`,
    LOGIN_SECURITY_CONFIG.RATE_LIMIT_IP_MAX,
    LOGIN_SECURITY_CONFIG.RATE_LIMIT_IP_WINDOW
  )

  if (!ipResult.success) {
    return {
      blocked: true,
      reason: 'ip',
      retryAfterSeconds: ipResult.resetInSeconds,
    }
  }

  // 2. Email rate limit check
  const normalizedEmail = email.trim().toLowerCase()
  const emailResult = await checkRateLimit(
    `login:email:${normalizedEmail}`,
    LOGIN_SECURITY_CONFIG.RATE_LIMIT_EMAIL_MAX,
    LOGIN_SECURITY_CONFIG.RATE_LIMIT_EMAIL_WINDOW
  )

  if (!emailResult.success) {
    return {
      blocked: true,
      reason: 'email',
      retryAfterSeconds: emailResult.resetInSeconds,
    }
  }

  return {
    blocked: false,
    reason: null,
    retryAfterSeconds: 0,
  }
}

/**
 * Retrieves the current consecutive fail count for an email.
 */
export async function getLoginFailCount(email: string): Promise<number> {
  const normalizedEmail = email.trim().toLowerCase()
  const key = `login:fail:${normalizedEmail}`
  const now = Date.now()

  try {
    const redis = await getRedis()
    if (redis && redis.isOpen) {
      const val = await redis.get(key)
      return val ? parseInt(val, 10) || 0 : 0
    }
  } catch (error) {
    console.warn(
      '[LoginSecurity] Redis getLoginFailCount error:',
      (error as Error).message
    )
  }

  // Fallback to memory
  const record = failCountMemoryStore.get(key)
  if (record && record.resetAt > now) {
    return record.count
  }
  return 0
}

/**
 * Increments the failed login counter for an email and returns the new count.
 * Sets expiry to LOCKOUT_DURATION_SECONDS.
 */
export async function incrementLoginFailCounter(
  email: string
): Promise<number> {
  const normalizedEmail = email.trim().toLowerCase()
  const key = `login:fail:${normalizedEmail}`
  const duration = LOGIN_SECURITY_CONFIG.LOCKOUT_DURATION_SECONDS
  const now = Date.now()

  try {
    const redis = await getRedis()
    if (redis && redis.isOpen) {
      const current = await redis.incr(key)
      if (current === 1) {
        await redis.expire(key, duration)
      } else {
        const ttl = await redis.ttl(key)
        if (ttl < 0) {
          await redis.expire(key, duration)
        }
      }
      return current
    }
  } catch (error) {
    console.warn(
      '[LoginSecurity] Redis incrementLoginFailCounter error:',
      (error as Error).message
    )
  }

  // Memory fallback
  const record = failCountMemoryStore.get(key)
  if (!record || record.resetAt <= now) {
    failCountMemoryStore.set(key, { count: 1, resetAt: now + duration * 1000 })
    return 1
  }

  record.count += 1
  return record.count
}

/**
 * Checks if the account is temporarily locked due to excessive failed attempts.
 */
export async function checkAccountLockout(
  email: string
): Promise<{ locked: boolean; remainingSeconds: number }> {
  const normalizedEmail = email.trim().toLowerCase()
  const key = `login:fail:${normalizedEmail}`
  const threshold = LOGIN_SECURITY_CONFIG.LOCKOUT_THRESHOLD
  const duration = LOGIN_SECURITY_CONFIG.LOCKOUT_DURATION_SECONDS
  const now = Date.now()

  try {
    const redis = await getRedis()
    if (redis && redis.isOpen) {
      const val = await redis.get(key)
      const count = val ? parseInt(val, 10) || 0 : 0

      if (count >= threshold) {
        let ttl = await redis.ttl(key)
        if (ttl < 0) {
          ttl = duration
          await redis.expire(key, duration)
        }
        return {
          locked: true,
          remainingSeconds: Math.max(1, ttl),
        }
      }

      return { locked: false, remainingSeconds: 0 }
    }
  } catch (error) {
    console.warn(
      '[LoginSecurity] Redis checkAccountLockout error:',
      (error as Error).message
    )
  }

  // Memory fallback
  const record = failCountMemoryStore.get(key)
  if (record && record.resetAt > now && record.count >= threshold) {
    const remainingSeconds = Math.max(
      1,
      Math.ceil((record.resetAt - now) / 1000)
    )
    return {
      locked: true,
      remainingSeconds,
    }
  }

  return { locked: false, remainingSeconds: 0 }
}

/**
 * Resets the failed login counter for an email upon successful login.
 */
export async function resetLoginFailCounter(email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase()
  const key = `login:fail:${normalizedEmail}`

  try {
    const redis = await getRedis()
    if (redis && redis.isOpen) {
      await redis.del(key)
    }
  } catch (error) {
    console.warn(
      '[LoginSecurity] Redis resetLoginFailCounter error:',
      (error as Error).message
    )
  }

  failCountMemoryStore.delete(key)
}

/**
 * Calculates progressive delay in ms to thwart brute-force timing attacks.
 */
export function calculateProgressiveDelay(failCount: number): number {
  const delays = LOGIN_SECURITY_CONFIG.PROGRESSIVE_DELAYS
  const index = Math.min(Math.max(0, failCount), delays.length - 1)
  return delays[index]
}
