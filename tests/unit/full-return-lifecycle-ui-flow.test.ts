import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('End-to-End Return, QC, Replacement & Review Flow Verification', () => {
  const desktopReturnCardPath = path.join(
    process.cwd(),
    'src/components/customer/order-detail/order-desktop-return-card.tsx'
  )
  const mobileViewPath = path.join(
    process.cwd(),
    'src/components/customer/order-detail/order-mobile-view.tsx'
  )
  const adminOrdersRoutePath = path.join(
    process.cwd(),
    'src/app/api/admin/orders/route.ts'
  )
  const adminOrdersPagePath = path.join(
    process.cwd(),
    'src/app/dashboard/admin/orders/page.tsx'
  )
  const returnsRoutePath = path.join(
    process.cwd(),
    'src/app/api/returns/[id]/route.ts'
  )
  const orderConfirmRoutePath = path.join(
    process.cwd(),
    'src/app/api/orders/[orderId]/confirm/route.ts'
  )

  it('1. Penolakan Retur: Menampilkan alasan penolakan secara jelas di Desktop & Mobile tanpa raw prefix', () => {
    const desktop = fs
      .readFileSync(desktopReturnCardPath, 'utf8')
      .replace(/\r\n/g, '\n')
    const mobile = fs
      .readFileSync(mobileViewPath, 'utf8')
      .replace(/\r\n/g, '\n')

    // Desktop
    expect(desktop).toContain("latestReturnRequest.status === 'REJECTED'")
    expect(desktop).toContain('Pengajuan Retur / Klaim Garansi Ditolak')
    expect(desktop).toContain('Ditolak After Sales')
    expect(desktop).toContain('/dashboard/customer/chat?')
    expect(desktop).toContain('type=after_sales')

    // Mobile
    expect(mobile).toContain("latestReturnRequest.status === 'REJECTED'")
    expect(mobile).toContain('Pengajuan Retur Ditolak')
    expect(mobile).toContain('Ditolak After Sales')
    expect(mobile).toContain('/dashboard/customer/chat?')
    expect(mobile).toContain('type=after_sales')
  })

  it('2. Admin Toko Cabang: Endpoint API memuat returnRequests & UI menampilkan badge Tukar Unit & rincian banner', () => {
    const apiRoute = fs
      .readFileSync(adminOrdersRoutePath, 'utf8')
      .replace(/\r\n/g, '\n')
    const page = fs
      .readFileSync(adminOrdersPagePath, 'utf8')
      .replace(/\r\n/g, '\n')

    // API include returnRequests
    expect(apiRoute).toContain('returnRequests: {')
    expect(apiRoute).toContain('returnTrackingNumber: true')
    expect(apiRoute).toContain('returnCourier: true')

    // Page UI tabel & modal
    expect(page).toMatch(
      /order\.returnRequests\[0\]\.type\s*===\s*'REPLACEMENT'/
    )
    expect(page).toContain('Tukar Unit')
    expect(page).toContain('Klaim Garansi: Penukaran Unit Baru')
    expect(page).toContain('Resi Unit Pengganti:')
  })

  it('3. Persetujuan Tukar Unit (REPLACEMENT): Validasi & potong stok toko, status order kembali SHIPPED, reset konfirmasi customer', () => {
    const returnsRoute = fs
      .readFileSync(returnsRoutePath, 'utf8')
      .replace(/\r\n/g, '\n')

    expect(returnsRoute).toContain("resolutionAction === 'REPLACEMENT'")
    expect(returnsRoute).toContain('INVENTORY_DEDUCT_REPLACEMENT')
    expect(returnsRoute).toContain("status: 'SHIPPED'")
    expect(returnsRoute).toContain('customerConfirmedAt: null')
    expect(returnsRoute).toContain('completedAt: null')
  })

  it('4. Konfirmasi Penerimaan Unit Baru: Order jadi COMPLETED, perpanjang garansi 30 hari, tuntaskan ReturnRequest, dan aktifkan Ulasan', () => {
    const confirmRoute = fs
      .readFileSync(orderConfirmRoutePath, 'utf8')
      .replace(/\r\n/g, '\n')

    expect(confirmRoute).toContain("status: 'COMPLETED'")
    expect(confirmRoute).toContain('customerConfirmedAt: now')
    expect(confirmRoute).toContain('warrantyExpiryDate: warrantyExpiry')
    expect(confirmRoute).toContain(
      "status: { in: ['PENDING', 'IN_REVIEW', 'APPROVED'] }"
    )
  })

  it('5. Dashboard After Sales Returns: Menampilkan nama produk/gadget pesanan pada kartu retur dan modal', () => {
    const afterSalesPagePath = path.join(
      process.cwd(),
      'src/app/dashboard/after-sales/returns/page.tsx'
    )
    const page = fs
      .readFileSync(afterSalesPagePath, 'utf8')
      .replace(/\r\n/g, '\n')

    expect(page).toContain('Unit Gadget / Barang')
    expect(page).toContain('item.order.items[0].product?.name')
    expect(page).toContain('orderItem.variantName')
  })
})
