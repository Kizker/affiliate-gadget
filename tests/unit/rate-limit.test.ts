import { describe, it, expect } from 'vitest'
import { checkRateLimit } from '../../src/lib/rate-limit'

describe('Rate Limiter Helper (Tahap 1)', () => {
  it('should allow requests within the limit', async () => {
    const testKey = `test-user-${Date.now()}`
    const result1 = await checkRateLimit(testKey, 3, 60)
    expect(result1.success).toBe(true)
    expect(result1.remaining).toBe(2)

    const result2 = await checkRateLimit(testKey, 3, 60)
    expect(result2.success).toBe(true)
    expect(result2.remaining).toBe(1)

    const result3 = await checkRateLimit(testKey, 3, 60)
    expect(result3.success).toBe(true)
    expect(result3.remaining).toBe(0)
  })

  it('should block requests that exceed the limit', async () => {
    const testKey = `test-blocked-${Date.now()}`
    const maxRequests = 2

    // Consume all allowed slots
    await checkRateLimit(testKey, maxRequests, 60)
    await checkRateLimit(testKey, maxRequests, 60)

    // 3rd attempt should be blocked
    const resultBlocked = await checkRateLimit(testKey, maxRequests, 60)
    expect(resultBlocked.success).toBe(false)
    expect(resultBlocked.remaining).toBe(0)
    expect(resultBlocked.resetInSeconds).toBeGreaterThan(0)
  })
})
