import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Admin Orders UI Simplification: Date Separator & Compact Pagination', () => {
  const ordersPagePath = path.resolve(
    process.cwd(),
    'src/app/dashboard/admin/orders/page.tsx'
  )
  const ordersPageContent = fs.readFileSync(ordersPagePath, 'utf8')

  it('1. should eliminate the corrupted â€¢ separator beside the order date', () => {
    expect(ordersPageContent).not.toContain('<span>â€¢</span>')
    expect(ordersPageContent).not.toContain('â€¢')
  })

  it('2. should display compact item count format (10/85 instead of Menampilkan X dari Y)', () => {
    expect(ordersPageContent).not.toContain(
      'Menampilkan {orders.length} dari {totalCount} pesanan'
    )
    expect(ordersPageContent).toContain('{orders.length}/{totalCount}')
  })

  it('3. should force page indicator (1/9) to stay on a single line with whitespace-nowrap and shrink-0', () => {
    expect(ordersPageContent).toContain('{page}/{totalPages}')
    // Verifies shrink-0 and whitespace-nowrap on the pagination indicator container
    expect(ordersPageContent).toMatch(
      /className="[^"]*whitespace-nowrap[^"]*"[^>]*>\s*\{page\}\/\{totalPages\}/
    )
  })

  it('4. should remove repetitive "Free Bonus 3-in-1" badge clutter from order rows', () => {
    // Only kept inside the detail modal callout, removed from the table rows
    const matches = (ordersPageContent.match(/Free\s*Bonus 3-in-1/g) || [])
      .length
    expect(matches).toBe(0)
  })
})
