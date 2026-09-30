import { describe, it, expect } from 'vitest'
import {
  DEFAULT_PAYMENT_EXPIRATION_MINUTES,
  DEFAULT_PAYMENT_EXPIRATION_SECONDS,
  isOrderPaymentExpired,
  getOrderPaymentRemainingSeconds,
  formatPaymentCountdown,
} from '@/lib/order-expiration'

describe('Dynamic Payment Expiration (Midtrans & 15-Minute Fastest QRIS Limit)', () => {
  it('enforces 15 minutes (900 seconds) duration constants for fastest payment method', () => {
    expect(DEFAULT_PAYMENT_EXPIRATION_MINUTES).toBe(15)
    expect(DEFAULT_PAYMENT_EXPIRATION_SECONDS).toBe(900)
  })

  it('correctly formats seconds into MM:SS when < 1 hour and HH:MM:SS when >= 1 hour', () => {
    // 15 minutes full
    expect(formatPaymentCountdown(900)).toBe('15:00')
    // 14 minutes, 52 seconds
    expect(formatPaymentCountdown(892)).toBe('14:52')
    // 45 seconds
    expect(formatPaymentCountdown(45)).toBe('00:45')
    // 0 or negative seconds
    expect(formatPaymentCountdown(0)).toBe('00:00')
    expect(formatPaymentCountdown(-10)).toBe('00:00')

    // 24 hours Virtual Account
    expect(formatPaymentCountdown(86400)).toBe('24:00:00')
    // 23 hours, 59 minutes, 52 seconds
    expect(formatPaymentCountdown(86392)).toBe('23:59:52')
    // 1 hour, 30 minutes, 15 seconds
    expect(formatPaymentCountdown(5415)).toBe('01:30:15')
  })

  it('determines if an order is active or expired based on 15 minutes default', () => {
    const now = Date.now()

    // Order created 5 minutes ago -> NOT expired, ~10 minutes left
    const recentOrder = {
      createdAt: new Date(now - 5 * 60 * 1000),
      status: 'PENDING_PAYMENT',
    }
    expect(isOrderPaymentExpired(recentOrder)).toBe(false)
    expect(getOrderPaymentRemainingSeconds(recentOrder)).toBeGreaterThan(500)

    // Order created 16 minutes ago -> EXPIRED
    const expiredOrder = {
      createdAt: new Date(now - 16 * 60 * 1000),
      status: 'PENDING_PAYMENT',
    }
    expect(isOrderPaymentExpired(expiredOrder)).toBe(true)
    expect(getOrderPaymentRemainingSeconds(expiredOrder)).toBe(0)

    // Order already PAID -> isOrderPaymentExpired should return false
    const paidOrder = {
      createdAt: new Date(now - 48 * 60 * 60 * 1000),
      status: 'PAID',
    }
    expect(isOrderPaymentExpired(paidOrder)).toBe(false)
  })

  it('respects active charge expiryTime from payment.notes without resetting', () => {
    const now = Date.now()

    // Order created 30 minutes ago, but user selected BCA VA with 24 hours expiry
    const futureExpiry = new Date(now + 23 * 3600 * 1000).toISOString()
    const vaOrder = {
      createdAt: new Date(now - 30 * 60 * 1000),
      status: 'PENDING_PAYMENT',
      payment: {
        notes: JSON.stringify({
          type: 'bca_va',
          expiryTime: futureExpiry,
          vaNumber: '21905458619390775283880',
        }),
      },
    }

    expect(isOrderPaymentExpired(vaOrder)).toBe(false)
    expect(getOrderPaymentRemainingSeconds(vaOrder)).toBeGreaterThan(80000)

    // Order with expired VA
    const pastExpiry = new Date(now - 1000).toISOString()
    const expiredVaOrder = {
      createdAt: new Date(now - 25 * 3600 * 1000),
      status: 'PENDING_PAYMENT',
      payment: {
        notes: JSON.stringify({
          type: 'bca_va',
          expiryTime: pastExpiry,
        }),
      },
    }

    expect(isOrderPaymentExpired(expiredVaOrder)).toBe(true)
    expect(getOrderPaymentRemainingSeconds(expiredVaOrder)).toBe(0)
  })
})
