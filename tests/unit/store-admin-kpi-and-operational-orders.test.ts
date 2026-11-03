import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Store Admin KPI & Operational Orders Suite', () => {
  const rootDir = process.cwd()

  const adminDashboardPagePath = path.join(
    rootDir,
    'src',
    'app',
    'dashboard',
    'admin',
    'page.tsx'
  )
  const adminDashboardApiPath = path.join(
    rootDir,
    'src',
    'app',
    'api',
    'admin',
    'dashboard',
    'route.ts'
  )
  const adminOrdersApiPath = path.join(
    rootDir,
    'src',
    'app',
    'api',
    'admin',
    'orders',
    'route.ts'
  )

  const dashboardPageContent = fs
    .readFileSync(adminDashboardPagePath, 'utf-8')
    .replace(/\r\n/g, '\n')
  const dashboardApiContent = fs.readFileSync(adminDashboardApiPath, 'utf-8')
  const ordersApiContent = fs.readFileSync(adminOrdersApiPath, 'utf-8')

  describe('1. Store Admin 4 KPI Cards Refinement', () => {
    it('verifies "Omset Toko Hari Ini" is rendered as Card 1 for STORE_ADMIN', () => {
      expect(dashboardPageContent).toContain('Omset Toko Hari Ini')
      expect(dashboardPageContent).toContain('todayRevenue')
      expect(dashboardPageContent).toContain('todayOrdersCount')
      expect(dashboardPageContent).toContain('● Hari Ini')
    })

    it('verifies "Perlu Proses Cepat" is rendered as Card 2 with urgency ping badge', () => {
      expect(dashboardPageContent).toContain('Perlu Proses Cepat')
      expect(dashboardPageContent).toContain('Siap Packing &amp; Kirim')
      expect(dashboardPageContent).toContain('animate-ping')
      expect(dashboardPageContent).toContain(
        '/dashboard/admin/orders?status=PAID'
      )
    })

    it('verifies "Alert Stok Cabang" is rendered as Card 3 with low stock & out of stock counters', () => {
      expect(dashboardPageContent).toContain('Alert Stok Cabang')
      expect(dashboardPageContent).toContain('lowStockCount')
      expect(dashboardPageContent).toContain('outOfStockCount')
      expect(dashboardPageContent).toContain('Unit Kritis')
      expect(dashboardPageContent).toContain('Stok Aman')
    })

    it('verifies "Katalog & Inventori" is rendered as Card 4 instead of returns (which are handled by After Sales)', () => {
      expect(dashboardPageContent).toContain('Katalog &amp; Inventori')
      expect(dashboardPageContent).toContain('Model Gadget')
      expect(dashboardPageContent).toContain('Unit')
      expect(dashboardPageContent).not.toContain('Retur &amp; Pembatalan')
    })

    it('verifies static Proteksi Garansi and Operasional Toko cards are eliminated from store admin KPI', () => {
      // In store admin section, there should be no Proteksi Garansi or Operasional Toko KPI cards
      const storeAdminSection = dashboardPageContent.slice(
        dashboardPageContent.indexOf('{isStoreAdmin && ('),
        dashboardPageContent.indexOf('{isSuperAdmin && (')
      )
      expect(storeAdminSection).not.toContain('PROTEKSI GARANSI')
      expect(storeAdminSection).not.toContain('OPERASIONAL TOKO')
      expect(storeAdminSection).not.toContain('Buka Operasional')
    })
  })

  describe('2. Status Pesanan di Dashboard (Clean UI)', () => {
    it('verifies 6 order pipeline status cards are rendered without clutter subtitles or return references', () => {
      expect(dashboardPageContent).toContain('Status Pesanan di Dashboard')
      expect(dashboardPageContent).not.toContain('Live Status')
      expect(dashboardPageContent).not.toContain(
        'Klik kartu status untuk memfilter'
      )
      expect(dashboardPageContent).toContain('Perlu Diproses')
      expect(dashboardPageContent).toContain('Sedang Diproses')
      expect(dashboardPageContent).toContain('Sedang Dikirim')
      expect(dashboardPageContent).toContain('Selesai')
      expect(dashboardPageContent).toContain('Menunggu Bayar')
      expect(dashboardPageContent).toContain('Dibatalkan')
      expect(dashboardPageContent).not.toContain('Retur &amp; Batal')
    })
  })

  describe('3. Main Orders Section & Quick In-Page Filter', () => {
    it('verifies Pesanan Masuk Cabang Toko is designated as Prioritas Operasional', () => {
      expect(dashboardPageContent).toContain('Pesanan Masuk Cabang Toko')
      expect(dashboardPageContent).toContain('Prioritas Operasional')
    })

    it('verifies orderFilter defaults to PAID (Perlu Diproses) and includes pagination', () => {
      expect(dashboardPageContent).toContain('orderFilter')
      expect(dashboardPageContent).toContain(
        "useState<\n    'ALL' | 'PAID' | 'IN_PROGRESS' | 'SHIPPED' | 'COMPLETED'\n  >('PAID')"
      )
      expect(dashboardPageContent).toContain("setOrderFilter('PAID')")
      expect(dashboardPageContent).toContain("setOrderFilter('IN_PROGRESS')")
      expect(dashboardPageContent).toContain("setOrderFilter('SHIPPED')")
      expect(dashboardPageContent).toContain("setOrderFilter('COMPLETED')")
      expect(dashboardPageContent).toContain("setOrderFilter('ALL')")
      expect(dashboardPageContent).toContain('ORDERS_PER_PAGE = 5')
      expect(dashboardPageContent).toContain('paginatedOrders.map')
    })

    it('verifies filteredOrders useMemo hook and status-based empty states', () => {
      expect(dashboardPageContent).toContain('filteredOrders')
      expect(dashboardPageContent).toContain('useMemo')
      expect(dashboardPageContent).toContain('filteredOrders.length === 0')
      expect(dashboardPageContent).toContain(
        'Tidak ada pesanan yang perlu diproses'
      )
      expect(dashboardPageContent).toContain(
        'Tidak ada pesanan yang sedang diproses'
      )
      expect(dashboardPageContent).toContain(
        'Tidak ada pesanan yang sedang dikirim'
      )
      expect(dashboardPageContent).toContain('Belum ada pesanan yang selesai')
    })

    it('verifies Rincian button directs to admin orders page with search query', () => {
      expect(dashboardPageContent).toContain(
        '/dashboard/admin/orders?search=${encodeURIComponent(order.orderNumber)}'
      )
    })
  })

  describe('4. Stock Section Elimination & Clean Management Link', () => {
    it('verifies Stok & Inventori (Opsi) section is completely eliminated from store admin layout', () => {
      expect(dashboardPageContent).not.toContain('id="stok-inventori-opsi"')
      expect(dashboardPageContent).not.toContain('showStockDetails')
      expect(dashboardPageContent).not.toContain('Buka Semua Inventori Produk')
      expect(dashboardPageContent).not.toContain('Stok &amp; Inventori (Opsi)')
    })

    it('verifies Card 3 links directly to products page with clean label without clutter suffix', () => {
      expect(dashboardPageContent).toContain('/dashboard/admin/products')
      expect(dashboardPageContent).not.toContain('handleStockClick')
    })
  })

  describe('5. Backend Dashboard & Orders API Calculations and Anti-Cache', () => {
    it('verifies /api/admin/dashboard calculates todayRevenue, todayOrdersCount, and stock alerts', () => {
      expect(dashboardApiContent).toContain('todayRevenue')
      expect(dashboardApiContent).toContain('todayOrdersCount')
      expect(dashboardApiContent).toContain('lowStockProducts')
      expect(dashboardApiContent).toContain('outOfStockProducts')
      expect(dashboardApiContent).toContain('startOfDay')
    })

    it('verifies /api/admin/orders route handler has force-dynamic and anti-cache headers', () => {
      expect(ordersApiContent).toContain(
        "export const dynamic = 'force-dynamic'"
      )
      expect(ordersApiContent).toContain('export const revalidate = 0')
      expect(ordersApiContent).toContain(
        "export const fetchCache = 'force-no-store'"
      )
      expect(ordersApiContent).toContain('NO_CACHE_HEADERS')
      expect(ordersApiContent).toContain('headers: NO_CACHE_HEADERS')
    })

    it('verifies /api/admin/orders scopes baseStatsWhere for STORE_ADMIN', () => {
      expect(ordersApiContent).toContain("user.role === 'STORE_ADMIN'")
      expect(ordersApiContent).toContain('baseStatsWhere.OR')
      expect(ordersApiContent).toContain('storeId: user.storeId')
    })

    it('verifies dashboard fetches up to 100 orders for comprehensive store admin operational pipeline', () => {
      expect(dashboardPageContent).toContain('/api/admin/orders?limit=100')
    })
  })

  describe('6. Product Performance & Critical Stock Insights (Replaces Returns on Store Admin)', () => {
    it('verifies Performa & Stok Produk card replaces Pengembalian & Pembatalan on store admin dashboard', () => {
      expect(dashboardPageContent).toContain('Performa &amp; Stok Produk')
      expect(dashboardPageContent).toContain('Produk Terlaris')
      expect(dashboardPageContent).toContain('Stok Perlu Restock')
      expect(dashboardPageContent).not.toContain(
        'Pengembalian &amp; Pembatalan'
      )
    })

    it('verifies list is limited to max 5 items for both top selling and critical stock products', () => {
      expect(dashboardPageContent).toContain('topSellingProducts.slice(0, 5)')
      expect(dashboardPageContent).toContain('criticalStockList.slice(0, 5)')
    })

    it('verifies dashboard API provides topSellingProducts and criticalProductsList', () => {
      expect(dashboardApiContent).toContain('topSellingProducts')
      expect(dashboardApiContent).toContain('criticalProductsList')
    })

    it('verifies real-time background sync via 3s polling and multi-event listeners', () => {
      expect(dashboardPageContent).toContain('setInterval')
      expect(dashboardPageContent).toContain('fetchDashboardData(true)')
      expect(dashboardPageContent).toContain('3000')
      expect(dashboardPageContent).toContain("window.addEventListener('focus'")
      expect(dashboardPageContent).toContain(
        "document.addEventListener('visibilitychange'"
      )
      expect(dashboardPageContent).toContain(
        "window.addEventListener('admin-notifications-refresh'"
      )
      expect(dashboardPageContent).toContain(
        "window.addEventListener('orders-updated'"
      )
      expect(dashboardPageContent).toContain(
        "window.addEventListener('storage'"
      )
    })

    it('verifies client fetch uses cache-busting and no-store headers', () => {
      expect(dashboardPageContent).toContain('_t=${Date.now()}')
      expect(dashboardPageContent).toContain("cache: 'no-store'")
      expect(dashboardPageContent).toContain('headers: {')
    })

    it('verifies dashboard API has force-dynamic, no-cache headers, and WIB startOfDay', () => {
      expect(dashboardApiContent).toContain(
        "export const dynamic = 'force-dynamic'"
      )
      expect(dashboardApiContent).toContain('export const revalidate = 0')
      expect(dashboardApiContent).toContain(
        "export const fetchCache = 'force-no-store'"
      )
      expect(dashboardApiContent).toContain('NO_CACHE_HEADERS')
      expect(dashboardApiContent).toContain("timeZone: 'Asia/Jakarta'")
      expect(dashboardApiContent).toContain('+07:00')
    })

    it('verifies 6 status cards link directly to orders page matching their respective status', () => {
      expect(dashboardPageContent).toContain(
        '/dashboard/admin/orders?status=PAID'
      )
      expect(dashboardPageContent).toContain(
        '/dashboard/admin/orders?status=IN_PROGRESS'
      )
      expect(dashboardPageContent).toContain(
        '/dashboard/admin/orders?status=SHIPPED'
      )
      expect(dashboardPageContent).toContain(
        '/dashboard/admin/orders?status=COMPLETED'
      )
      expect(dashboardPageContent).toContain(
        '/dashboard/admin/orders?status=PENDING_PAYMENT'
      )
      expect(dashboardPageContent).toContain(
        '/dashboard/admin/orders?status=CANCELLED'
      )
      expect(dashboardPageContent).not.toContain('handleStatusFilterClick')
      expect(dashboardPageContent).not.toContain('handleReturnsFilterClick')
    })
  })
})
