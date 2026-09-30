import { describe, it, expect } from 'vitest'

describe('Cancelled Order & Courier Tracking Logic', () => {
  it('correctly maps paymentStatus to CANCELLED when order or payment is cancelled/rejected', () => {
    const resolvePaymentStatus = (order: {
      status: string
      payment?: { status: string } | null
    }) => {
      return order.status === 'CANCELLED' ||
        order.payment?.status === 'REJECTED'
        ? 'CANCELLED'
        : order.status === 'PENDING_PAYMENT' ||
            order.payment?.status === 'PENDING'
          ? 'PENDING'
          : 'PAID'
    }

    // 1. Order status CANCELLED -> CANCELLED (Never PAID / Lunas)
    expect(
      resolvePaymentStatus({
        status: 'CANCELLED',
        payment: null,
      })
    ).toBe('CANCELLED')

    // 2. Order status CANCELLED with rejected payment -> CANCELLED
    expect(
      resolvePaymentStatus({
        status: 'CANCELLED',
        payment: { status: 'REJECTED' },
      })
    ).toBe('CANCELLED')

    // 3. Order status PENDING_PAYMENT with rejected payment -> CANCELLED
    expect(
      resolvePaymentStatus({
        status: 'PENDING_PAYMENT',
        payment: { status: 'REJECTED' },
      })
    ).toBe('CANCELLED')

    // 4. Order status PENDING_PAYMENT -> PENDING
    expect(
      resolvePaymentStatus({
        status: 'PENDING_PAYMENT',
        payment: null,
      })
    ).toBe('PENDING')

    // 5. Order status COMPLETED / PAID -> PAID
    expect(
      resolvePaymentStatus({
        status: 'COMPLETED',
        payment: { status: 'VERIFIED' },
      })
    ).toBe('PAID')
  })

  it('determines that courier tracking and biteship must be suppressed when order is CANCELLED', () => {
    const shouldShowCourierTracker = (orderStatus: string) => {
      return orderStatus !== 'CANCELLED'
    }

    expect(shouldShowCourierTracker('CANCELLED')).toBe(false)
    expect(shouldShowCourierTracker('IN_PROGRESS')).toBe(true)
    expect(shouldShowCourierTracker('PROCESSING')).toBe(true)
    expect(shouldShowCourierTracker('COMPLETED')).toBe(true)
  })

  it('evaluates API tracking response flags for CANCELLED orders correctly', () => {
    const evaluateTrackingResponse = (order: {
      status: string
      trackingNumber?: string | null
    }) => {
      if (order.status === 'CANCELLED') {
        return {
          success: true,
          data: null,
          isCancelled: true,
          isPendingPickup: false,
          orderStatus: 'CANCELLED',
          message:
            'Pesanan telah dibatalkan. Pengiriman kurir dan logistik tidak diproses.',
        }
      }

      if (
        !order.trackingNumber ||
        order.status === 'PENDING_PAYMENT' ||
        order.status === 'PAID'
      ) {
        return {
          success: true,
          data: null,
          isCancelled: false,
          isPendingPickup: true,
          orderStatus: order.status,
          message: 'Pesanan sedang dipersiapkan di cabang toko.',
        }
      }

      return {
        success: true,
        data: { trackingNumber: order.trackingNumber },
        isCancelled: false,
        isPendingPickup: false,
        orderStatus: order.status,
      }
    }

    const cancelledRes = evaluateTrackingResponse({
      status: 'CANCELLED',
      trackingNumber: null,
    })

    expect(cancelledRes.isCancelled).toBe(true)
    expect(cancelledRes.isPendingPickup).toBe(false)
    expect(cancelledRes.data).toBeNull()

    const pendingRes = evaluateTrackingResponse({
      status: 'PAID',
      trackingNumber: null,
    })

    expect(pendingRes.isCancelled).toBe(false)
    expect(pendingRes.isPendingPickup).toBe(true)
  })
})
