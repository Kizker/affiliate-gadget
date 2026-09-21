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
  createdAt?: Date
}

interface MockReview {
  id: string
  userId: string
  productId: string
  orderId: string | null
  rating: number
  comment: string | null
}

const ELIGIBLE_CHECKOUT_STATUSES = [
  'PENDING_PAYMENT',
  'PAID',
  'IN_PROGRESS',
  'SHIPPED',
  'COMPLETED',
]

describe('Product Review Eligibility Engine (Completed Checkout Only)', () => {
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

    // Find valid checked out order for this user containing this product
    const checkedOutOrder = orders.find(
      (o) =>
        o.userId === userId &&
        ELIGIBLE_CHECKOUT_STATUSES.includes(o.status) &&
        o.items.some((i) => i.productId === productId)
    )

    // MUST have a completed checkout order!
    if (!checkedOutOrder) {
      return {
        isLoggedIn: true,
        canReview: false,
        eligibleOrderId: null,
        error:
          'Ulasan hanya dapat diberikan oleh customer yang telah selesai checkout produk ini.',
      }
    }

    return {
      isLoggedIn: true,
      canReview: true,
      eligibleOrderId: checkedOutOrder.id,
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

  it('should forbid review if customer has never checked out this product', () => {
    const orders: MockOrder[] = [
      {
        id: 'ord-1',
        userId: 'user-1',
        status: 'PAID',
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
    expect(result.eligibleOrderId).toBeNull()
    expect(result.error).toContain('telah selesai checkout produk ini')
  })

  it('should forbid review if customer order is CANCELLED', () => {
    const orders: MockOrder[] = [
      {
        id: 'ord-cancelled',
        userId: 'user-1',
        status: 'CANCELLED',
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
    expect(result.eligibleOrderId).toBeNull()
    expect(result.error).toBe(
      'Ulasan hanya dapat diberikan oleh customer yang telah selesai checkout produk ini.'
    )
  })

  it('should grant review eligibility across all valid completed checkout statuses', () => {
    const validStatuses: Array<MockOrder['status']> = [
      'PENDING_PAYMENT',
      'PAID',
      'IN_PROGRESS',
      'SHIPPED',
      'COMPLETED',
    ]

    for (const status of validStatuses) {
      const orders: MockOrder[] = [
        {
          id: `ord-${status}`,
          userId: 'user-1',
          status,
          items: [{ productId: 'prod-123', variantName: '12/512GB' }],
          storeId: 'store-1',
        },
      ]

      const result = checkReviewEligibility({
        userId: 'user-1',
        productId: 'prod-123',
        orders,
        existingReview: null,
      })

      expect(result.canReview).toBe(true)
      expect(result.eligibleOrderId).toBe(`ord-${status}`)
      expect(result.error).toBeNull()
    }
  })

  it('should forbid review even if user has an orphan review without a completed checkout order', () => {
    const orphanReview: MockReview = {
      id: 'rev-orphan',
      userId: 'user-1',
      productId: 'prod-123',
      orderId: null,
      rating: 5,
      comment: 'Tes ulasan tanpa checkout',
    }

    const result = checkReviewEligibility({
      userId: 'user-1',
      productId: 'prod-123',
      orders: [],
      existingReview: orphanReview,
    })

    expect(result.canReview).toBe(false)
    expect(result.eligibleOrderId).toBeNull()
    expect(result.error).toContain('telah selesai checkout produk ini')
  })

  it('should allow customer with completed checkout order to edit their review', () => {
    const orders: MockOrder[] = [
      {
        id: 'ord-success-edit',
        userId: 'user-1',
        status: 'PAID',
        items: [{ productId: 'prod-123' }],
        storeId: 'store-1',
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

  it('should strictly isolate eligibility: checking out Product A gives review rights on Product A ONLY, not Product B', () => {
    const orders: MockOrder[] = [
      {
        id: 'ord-product-a',
        userId: 'customer@test.com',
        status: 'PAID',
        items: [{ productId: 'product-a' }],
        storeId: 'store-1',
      },
    ]

    // Check on Product A -> SHOULD be eligible
    const resultA = checkReviewEligibility({
      userId: 'customer@test.com',
      productId: 'product-a',
      orders,
      existingReview: null,
    })
    expect(resultA.canReview).toBe(true)
    expect(resultA.eligibleOrderId).toBe('ord-product-a')

    // Check on Product B -> MUST NOT be eligible
    const resultB = checkReviewEligibility({
      userId: 'customer@test.com',
      productId: 'product-b',
      orders,
      existingReview: null,
    })
    expect(resultB.canReview).toBe(false)
    expect(resultB.eligibleOrderId).toBeNull()
    expect(resultB.error).toBe(
      'Ulasan hanya dapat diberikan oleh customer yang telah selesai checkout produk ini.'
    )
  })
})
