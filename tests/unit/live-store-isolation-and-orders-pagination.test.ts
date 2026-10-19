import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('1. Live Streaming Multi-PT Store Isolation', () => {
  const broadcasterPath = path.resolve(
    process.cwd(),
    'src/components/live/live-stream-broadcaster.tsx'
  )
  const dealsRoutePath = path.resolve(
    process.cwd(),
    'src/app/api/live-streams/[id]/deals/route.ts'
  )
  const liveRoutePath = path.resolve(
    process.cwd(),
    'src/app/api/live-streams/[id]/route.ts'
  )
  const gadgetsRoutePath = path.resolve(
    process.cwd(),
    'src/app/api/gadgets/route.ts'
  )

  const broadcasterContent = fs.readFileSync(broadcasterPath, 'utf8')
  const dealsRouteContent = fs.readFileSync(dealsRoutePath, 'utf8')
  const liveRouteContent = fs.readFileSync(liveRoutePath, 'utf8')
  const gadgetsRouteContent = fs.readFileSync(gadgetsRoutePath, 'utf8')

  it('should restrict live stream product catalog fetching to the logged-in store admin', () => {
    // Ensures broadcaster queries products by storeId & scoped=true
    expect(broadcasterContent).toContain(
      '/api/gadgets?limit=500&storeId=${myStoreId}&scoped=true'
    )
  })

  it('should filter stream selection to only streams owned by the store admin', () => {
    expect(broadcasterContent).toContain('s.storeId === myStoreId')
  })

  it('should reject live deal creation if the product does not belong to the stream store (403 Forbidden)', () => {
    expect(dealsRouteContent).toContain('product.storeId !== stream.storeId')
    expect(dealsRouteContent).toContain('Produk ini bukan milik toko Anda')
    expect(dealsRouteContent).toContain('status: 403')
  })

  it('should filter featured product pins in live stream PATCH to only products belonging to the store', () => {
    expect(liveRouteContent).toContain('storeId: stream.storeId')
    expect(liveRouteContent).toContain('validProducts.map((p) => p.id)')
  })

  it('should enforce store scoping in gadgets GET endpoint for store accounts', () => {
    expect(gadgetsRouteContent).toContain("u?.role !== 'SUPER_ADMIN'")
    expect(gadgetsRouteContent).toContain("session.user.role !== 'SUPER_ADMIN'")
    expect(gadgetsRouteContent).toContain('where.storeId = storeId')
  })
})

describe('2. Customer Orders Pagination (Desktop & Mobile)', () => {
  const desktopClientPath = path.resolve(
    process.cwd(),
    'src/app/dashboard/customer/orders/orders-client.tsx'
  )
  const mobileViewPath = path.resolve(
    process.cwd(),
    'src/components/customer/mobile-orders-view.tsx'
  )

  const desktopContent = fs.readFileSync(desktopClientPath, 'utf8')
  const mobileContent = fs.readFileSync(mobileViewPath, 'utf8')

  it('should define ORDERS_PER_PAGE = 10 on desktop customer orders client', () => {
    expect(desktopContent).toContain('const ORDERS_PER_PAGE = 10')
    expect(desktopContent).toContain(
      'const [currentPage, setCurrentPage] = useState(1)'
    )
    expect(desktopContent).toContain('paginatedOrders.map((order)')
  })

  it('should render compact pagination info and single-line indicator on desktop', () => {
    expect(desktopContent).toContain(
      '{paginatedOrders.length}/{filteredOrders.length}'
    )
    expect(desktopContent).toContain('{currentPage}/{totalPages}')
    // Verification of shrink-0 and whitespace-nowrap
    expect(desktopContent).toMatch(
      /className="[^"]*whitespace-nowrap[^"]*"[^>]*>\s*\{currentPage\}\/\{totalPages\}/
    )
  })

  it('should reset desktop pagination to page 1 on status filter or search change', () => {
    expect(desktopContent).toContain('setCurrentPage(1)')
  })

  it('should define ORDERS_PER_PAGE = 10 on mobile customer orders view', () => {
    expect(mobileContent).toContain('const ORDERS_PER_PAGE = 10')
    expect(mobileContent).toContain(
      'const [currentPage, setCurrentPage] = useState(1)'
    )
    expect(mobileContent).toContain('paginatedOrders.map((order)')
  })

  it('should render compact pagination info and single-line indicator on mobile', () => {
    expect(mobileContent).toContain(
      '{paginatedOrders.length}/{filteredOrders.length}'
    )
    expect(mobileContent).toContain('{currentPage}/{totalPages}')
    // Verification of shrink-0 and whitespace-nowrap
    expect(mobileContent).toMatch(
      /className="[^"]*whitespace-nowrap[^"]*"[^>]*>\s*\{currentPage\}\/\{totalPages\}/
    )
  })

  it('should reset mobile pagination to page 1 on status tab or search change', () => {
    expect(mobileContent).toMatch(
      /handleTabClick\s*=\s*\([^)]*\)\s*=>\s*\{[^}]*setCurrentPage\(1\)/s
    )
  })
})
