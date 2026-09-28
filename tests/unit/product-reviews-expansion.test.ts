import { describe, it, expect } from 'vitest'

interface MockReview {
  id: string
  rating: number
  comment: string
  createdAt: string
}

function resolveVisibleReviews(
  reviews: MockReview[],
  isExpanded: boolean
): {
  visibleReviews: MockReview[]
  showLainnyaTrigger: boolean
  remainingCount: number
} {
  const showLainnyaTrigger = reviews.length > 3
  const visibleReviews = isExpanded ? reviews : reviews.slice(0, 3)
  const remainingCount = Math.max(0, reviews.length - 3)

  return {
    visibleReviews,
    showLainnyaTrigger,
    remainingCount,
  }
}

describe('Product Reviews Expansion Engine (Initial 3 Newest & Lainnya Trigger)', () => {
  const dummyReviews: MockReview[] = [
    {
      id: 'rev-1',
      rating: 5,
      comment: 'Unit mulus banget!',
      createdAt: '2026-09-27T10:00:00Z',
    },
    {
      id: 'rev-2',
      rating: 5,
      comment: 'Baterai masih 98% mantap',
      createdAt: '2026-09-26T12:00:00Z',
    },
    {
      id: 'rev-3',
      rating: 4,
      comment: 'Pengiriman cepat via Gojek',
      createdAt: '2026-09-25T08:00:00Z',
    },
    {
      id: 'rev-4',
      rating: 5,
      comment: 'Bonus 3-in-1 lengkap',
      createdAt: '2026-09-24T14:00:00Z',
    },
    {
      id: 'rev-5',
      rating: 5,
      comment: 'Pelayanan toko roxy sangat ramah',
      createdAt: '2026-09-23T11:00:00Z',
    },
    {
      id: 'rev-6',
      rating: 4,
      comment: 'Recomended seller!',
      createdAt: '2026-09-22T09:00:00Z',
    },
  ]

  it('should only show the first 3 reviews initially when collapsed', () => {
    const { visibleReviews, showLainnyaTrigger, remainingCount } =
      resolveVisibleReviews(dummyReviews, false)

    expect(visibleReviews).toHaveLength(3)
    expect(visibleReviews[0].id).toBe('rev-1')
    expect(visibleReviews[1].id).toBe('rev-2')
    expect(visibleReviews[2].id).toBe('rev-3')
    expect(showLainnyaTrigger).toBe(true)
    expect(remainingCount).toBe(3)
  })

  it('should show all reviews when user clicks Lainnya (isExpanded = true)', () => {
    const { visibleReviews, showLainnyaTrigger, remainingCount } =
      resolveVisibleReviews(dummyReviews, true)

    expect(visibleReviews).toHaveLength(6)
    expect(visibleReviews[5].id).toBe('rev-6')
    expect(showLainnyaTrigger).toBe(true)
    expect(remainingCount).toBe(3)
  })

  it('should not show Lainnya trigger when total reviews are 3 or fewer', () => {
    const fewReviews = dummyReviews.slice(0, 2)
    const { visibleReviews, showLainnyaTrigger, remainingCount } =
      resolveVisibleReviews(fewReviews, false)

    expect(visibleReviews).toHaveLength(2)
    expect(showLainnyaTrigger).toBe(false)
    expect(remainingCount).toBe(0)
  })

  it('should handle exactly 3 reviews without triggering Lainnya', () => {
    const exact3 = dummyReviews.slice(0, 3)
    const { visibleReviews, showLainnyaTrigger, remainingCount } =
      resolveVisibleReviews(exact3, false)

    expect(visibleReviews).toHaveLength(3)
    expect(showLainnyaTrigger).toBe(false)
    expect(remainingCount).toBe(0)
  })

  it('should reset expansion state on filter or sort change', () => {
    let isExpanded = true
    const onFilterChange = () => {
      isExpanded = false
    }

    onFilterChange()
    expect(isExpanded).toBe(false)

    const result = resolveVisibleReviews(dummyReviews, isExpanded)
    expect(result.visibleReviews).toHaveLength(3)
  })
})
