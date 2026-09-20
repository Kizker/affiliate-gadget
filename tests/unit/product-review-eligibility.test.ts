import { describe, it, expect } from 'vitest'

interface MockOrder {
  id: string
  userId: string
  status:
    | 'PENDING_PAYMENT'
    | 'PAID'
    | 'IN_PROGRESS'
    | 'SHIPPED'
    | 'COMPLETED'
    | 'CANCELLED'
  items: Array<{ productId: string; variantName?: string }>
  storeId: string
  completedAt?: Date
}

interface MockReview {
  id: string
  userId: string
  productId: string
  orderId: string | null
  rating: number
  comment: string | null
}

describe('Product Review Eligibility Engine (Completed Orders Only)', () => {
  // Helper simulating the backend review validation logic
  function checkReviewEligibility({
    userId,
    productId,
    orders,
    existingReview,
  }: {
    userId: string | null
    productId: string
    orders: MockOrder[]
    existingReview: MockReview | null
  }) {
    if (!userId) {
      return {
        isLoggedIn: false,
        canReview: false,
        error: 'Silakan masuk untuk memberikan ulasan',
      }
    }

    // Strictly find completed orders for this user and product
    const completedOrder = orders.find(
      (o) =>
        o.userId === userId &&
        o.status === 'COMPLETED' &&
        o.items.some((i) => i.productId === productId)
    )

    // MUST have a completed order!
    if (!completedOrder) {
      return {
        isLoggedIn: true,
        canReview: false,
        eligibleOrderId: null,
        error:
          'Ulasan hanya dapat diberikan oleh customer yang telah membeli produk ini dan status pesanannya sudah selesai.',
      }
    }

    return {
      isLoggedIn: true,
      canReview: true,
      eligibleOrderId: completedOrder.id,
      existingReview: existingReview || null,
      error: null,
    }
  }

  it('should reject unauthenticated users', () => {
    const result = checkReviewEligibility({
      userId: null,
      productId: 'prod-123',
      orders: [],
      existingReview: null,
    })

    expect(result.isLoggedIn).toBe(false)
    expect(result.canReview).toBe(false)
    expect(result.error).toBe('Silakan masuk untuk memberikan ulasan')
  })

  it('should forbid review if customer has no orders for the product', () => {
    const orders: MockOrder[] = [
      {
        id: 'ord-1',
        userId: 'user-1',
        status: 'COMPLETED',
        items: [{ productId: 'prod-999' }],
        storeId: 'store-1',
      },
    ]

    const result = checkReviewEligibility({
      userId: 'user-1',
      productId: 'prod-123',
      orders,
      existingReview: null,
    })

    expect(result.isLoggedIn).toBe(true)
    expect(result.canReview).toBe(false)
    expect(result.error).toContain('status pesanannya sudah selesai')
  })

  it('should forbid review if order is PENDING_PAYMENT, PAID, IN_PROGRESS, or SHIPPED (not COMPLETED)', () => {
    const nonCompletedStatuses: Array<MockOrder['status']> = [
      'PENDING_PAYMENT',
      'PAID',
      'IN_PROGRESS',
      'SHIPPED',
      'CANCELLED',
    ]

    for (const status of nonCompletedStatuses) {
      const orders: MockOrder[] = [
        {
          id: `ord-${status}`,
          userId: 'user-1',
          status,
          items: [{ productId: 'prod-123' }],
          storeId: 'store-1',
        },
      ]

      const result = checkReviewEligibility({
        userId: 'user-1',
        productId: 'prod-123',
        orders,
        existingReview: null,
      })

      expect(result.canReview).toBe(false)
      expect(result.error).toBe(
        'Ulasan hanya dapat diberikan oleh customer yang telah membeli produk ini dan status pesanannya sudah selesai.'
      )
    }
  })

  it('should forbid review even if user has an orphan review without a COMPLETED order', () => {
    const orphanReview: MockReview = {
      id: 'rev-orphan',
      userId: 'user-1',
      productId: 'prod-123',
      orderId: null,
      rating: 5,
      comment: 'Tes ulasan tanpa beli',
    }

    const result = checkReviewEligibility({
      userId: 'user-1',
      productId: 'prod-123',
      orders: [],
      existingReview: orphanReview,
    })

    expect(result.canReview).toBe(false)
    expect(result.eligibleOrderId).toBeNull()
    expect(result.error).toContain('status pesanannya sudah selesai')
  })

  it('should grant review eligibility if order status is COMPLETED', () => {
    const orders: MockOrder[] = [
      {
        id: 'ord-success',
        userId: 'user-1',
        status: 'COMPLETED',
        items: [{ productId: 'prod-123', variantName: '12/512GB Titanium' }],
        storeId: 'store-1',
        completedAt: new Date(),
      },
    ]

    const result = checkReviewEligibility({
      userId: 'user-1',
      productId: 'prod-123',
      orders,
      existingReview: null,
    })

    expect(result.isLoggedIn).toBe(true)
    expect(result.canReview).toBe(true)
    expect(result.eligibleOrderId).toBe('ord-success')
    expect(result.error).toBeNull()
  })

  it('should allow customer with completed order to edit their review', () => {
    const orders: MockOrder[] = [
      {
        id: 'ord-success-edit',
        userId: 'user-1',
        status: 'COMPLETED',
        items: [{ productId: 'prod-123' }],
        storeId: 'store-1',
        completedAt: new Date(),
      },
    ]

    const existingReview: MockReview = {
      id: 'rev-1',
      userId: 'user-1',
      productId: 'prod-123',
      orderId: 'ord-success-edit',
      rating: 5,
      comment: 'Barang sangat bagus',
    }

    const result = checkReviewEligibility({
      userId: 'user-1',
      productId: 'prod-123',
      orders,
      existingReview,
    })

    expect(result.canReview).toBe(true)
    expect(result.eligibleOrderId).toBe('ord-success-edit')
    expect(result.existingReview).toEqual(existingReview)
  })
})
