import { describe, it, expect } from 'vitest'

// Pure logic functions mirroring src/app/dashboard/admin/finance/page.tsx
function computeDesktopPagination<T>(
  items: T[],
  currentPage: number,
  itemsPerPage: number
) {
  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage))
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages)
  const startIndex = (safeCurrentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, items.length)
  const paginatedItems = items.slice(startIndex, endIndex)

  return {
    totalPages,
    safeCurrentPage,
    startIndex,
    endIndex,
    paginatedItems,
  }
}

function getPageNumbers(totalPages: number, safeCurrentPage: number) {
  const pages: (number | string)[] = []
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    if (safeCurrentPage <= 3) {
      pages.push(1, 2, 3, 4, '...', totalPages)
    } else if (safeCurrentPage >= totalPages - 2) {
      pages.push(
        1,
        '...',
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages
      )
    } else {
      pages.push(
        1,
        '...',
        safeCurrentPage - 1,
        safeCurrentPage,
        safeCurrentPage + 1,
        '...',
        totalPages
      )
    }
  }
  return pages
}

function computeMobileLazyLoading<T>(
  items: T[],
  visibleCount: number
) {
  const mobileHasMore = visibleCount < items.length
  const displayedItems = items.slice(0, visibleCount)
  return {
    mobileHasMore,
    displayedItems,
  }
}

describe('Finance Dashboard Pagination & Lazy Loading Suite', () => {
  const mockMutations = Array.from({ length: 45 }, (_, i) => ({
    id: `tx-${i + 1}`,
    refNumber: `ORD-2026-09-${1000 + i}`,
    title: `Penjualan Gadget #${i + 1}`,
    amount: 15000000,
    category: i % 2 === 0 ? 'SALE' : 'COMMISSION',
  }))

  describe('Desktop Pagination Math', () => {
    it('should correctly calculate total pages and slice items for page 1 (default 10 per page)', () => {
      const res = computeDesktopPagination(mockMutations, 1, 10)
      expect(res.totalPages).toBe(5)
      expect(res.safeCurrentPage).toBe(1)
      expect(res.startIndex).toBe(0)
      expect(res.endIndex).toBe(10)
      expect(res.paginatedItems.length).toBe(10)
      expect(res.paginatedItems[0].id).toBe('tx-1')
      expect(res.paginatedItems[9].id).toBe('tx-10')
    })

    it('should correctly calculate page 5 (last page with remaining 5 items)', () => {
      const res = computeDesktopPagination(mockMutations, 5, 10)
      expect(res.totalPages).toBe(5)
      expect(res.safeCurrentPage).toBe(5)
      expect(res.startIndex).toBe(40)
      expect(res.endIndex).toBe(45)
      expect(res.paginatedItems.length).toBe(5)
      expect(res.paginatedItems[0].id).toBe('tx-41')
      expect(res.paginatedItems[4].id).toBe('tx-45')
    })

    it('should clamp safeCurrentPage when currentPage exceeds totalPages', () => {
      const res = computeDesktopPagination(mockMutations, 999, 10)
      expect(res.safeCurrentPage).toBe(5)
      expect(res.paginatedItems.length).toBe(5)
    })

    it('should clamp safeCurrentPage when currentPage is less than 1', () => {
      const res = computeDesktopPagination(mockMutations, 0, 10)
      expect(res.safeCurrentPage).toBe(1)
      expect(res.paginatedItems.length).toBe(10)
    })

    it('should support dynamic itemsPerPage (25 and 50)', () => {
      const res25 = computeDesktopPagination(mockMutations, 1, 25)
      expect(res25.totalPages).toBe(2)
      expect(res25.paginatedItems.length).toBe(25)

      const res50 = computeDesktopPagination(mockMutations, 1, 50)
      expect(res50.totalPages).toBe(1)
      expect(res50.paginatedItems.length).toBe(45)
    })

    it('should handle empty items array gracefully with totalPages 1', () => {
      const res = computeDesktopPagination([], 1, 10)
      expect(res.totalPages).toBe(1)
      expect(res.safeCurrentPage).toBe(1)
      expect(res.startIndex).toBe(0)
      expect(res.endIndex).toBe(0)
      expect(res.paginatedItems).toEqual([])
    })
  })

  describe('Page Number Navigation Generator', () => {
    it('should return simple range when totalPages <= 5', () => {
      expect(getPageNumbers(3, 1)).toEqual([1, 2, 3])
      expect(getPageNumbers(5, 3)).toEqual([1, 2, 3, 4, 5])
    })

    it('should render leading window with ellipsis when near start (e.g. page 2 of 10)', () => {
      expect(getPageNumbers(10, 2)).toEqual([1, 2, 3, 4, '...', 10])
    })

    it('should render trailing window with ellipsis when near end (e.g. page 9 of 10)', () => {
      expect(getPageNumbers(10, 9)).toEqual([1, '...', 7, 8, 9, 10])
    })

    it('should render center window with dual ellipsis when in middle (e.g. page 5 of 10)', () => {
      expect(getPageNumbers(10, 5)).toEqual([1, '...', 4, 5, 6, '...', 10])
    })
  })

  describe('Mobile Lazy Loading Logic', () => {
    it('should start with initial visible count and indicate more items available', () => {
      const res = computeMobileLazyLoading(mockMutations, 10)
      expect(res.mobileHasMore).toBe(true)
      expect(res.displayedItems.length).toBe(10)
    })

    it('should incrementally expand displayed items in batches (+8)', () => {
      let count = 10
      count = Math.min(count + 8, mockMutations.length)
      expect(count).toBe(18)

      const step1 = computeMobileLazyLoading(mockMutations, count)
      expect(step1.displayedItems.length).toBe(18)
      expect(step1.mobileHasMore).toBe(true)

      // Simulate reaching end
      count = 45
      const stepFinal = computeMobileLazyLoading(mockMutations, count)
      expect(stepFinal.displayedItems.length).toBe(45)
      expect(stepFinal.mobileHasMore).toBe(false)
    })

    it('should handle small datasets where all items fit initially', () => {
      const smallList = mockMutations.slice(0, 5)
      const res = computeMobileLazyLoading(smallList, 10)
      expect(res.mobileHasMore).toBe(false)
      expect(res.displayedItems.length).toBe(5)
    })
  })
})
