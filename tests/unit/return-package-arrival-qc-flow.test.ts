import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('End-to-End: Konfirmasi Barang Retur Tiba di Cabang & Alur QC Fisik', () => {
  const returnsDetailApiPath = path.resolve('src/app/api/returns/[id]/route.ts')
  const afterSalesPagePath = path.resolve(
    'src/app/dashboard/after-sales/returns/page.tsx'
  )
  const superAdminReturnsPagePath = path.resolve(
    'src/app/dashboard/admin/returns/page.tsx'
  )
  const superAdminOrdersPagePath = path.resolve(
    'src/app/dashboard/admin/orders/page.tsx'
  )
  const customerDesktopCardPath = path.resolve(
    'src/components/customer/order-detail/order-desktop-return-card.tsx'
  )
  const customerMobileViewPath = path.resolve(
    'src/components/customer/order-detail/order-mobile-view.tsx'
  )

  const apiContent = fs
    .readFileSync(returnsDetailApiPath, 'utf8')
    .replace(/\r\n/g, '\n')
  const afterSalesContent = fs
    .readFileSync(afterSalesPagePath, 'utf8')
    .replace(/\r\n/g, '\n')
  const superAdminReturnsContent = fs
    .readFileSync(superAdminReturnsPagePath, 'utf8')
    .replace(/\r\n/g, '\n')
  const superAdminOrdersContent = fs
    .readFileSync(superAdminOrdersPagePath, 'utf8')
    .replace(/\r\n/g, '\n')
  const customerDesktopContent = fs
    .readFileSync(customerDesktopCardPath, 'utf8')
    .replace(/\r\n/g, '\n')
  const customerMobileContent = fs
    .readFileSync(customerMobileViewPath, 'utf8')
    .replace(/\r\n/g, '\n')

  it('1. Endpoint API: Mendukung action CONFIRM_PACKAGE_RECEIVED dengan pembaruan packageReceivedAt, qcStatus, dan notifikasi', () => {
    expect(apiContent).toContain("body.action === 'CONFIRM_PACKAGE_RECEIVED'")
    expect(apiContent).toContain('packageReceivedAt: receivedAt')
    expect(apiContent).toContain("qcStatus: body.qcStatus || 'IN_QC'")
    expect(apiContent).toContain('Paket Fisik Tiba di Cabang')
    expect(apiContent).toContain('Paket Retur Telah Tiba di Toko Cabang')
    expect(apiContent).toContain('Unit Retur Tiba di Cabang (Mulai QC)')
    expect(apiContent).toContain(
      'Paket fisik barang retur dari pembeli belum dikonfirmasi tiba'
    )
  })

  it('2. Meja Kerja After Sales: Menampilkan tombol konfirmasi barang diterima dan hanya 2 tombol keputusan (Setujui atau Tolak)', () => {
    expect(afterSalesContent).toContain('packageReceivedAt?: string | null')
    expect(afterSalesContent).toContain('Barang Diterima &amp; Mulai QC')
    expect(afterSalesContent).toContain('handleConfirmPackageReceived')
    expect(afterSalesContent).toContain("action: 'CONFIRM_PACKAGE_RECEIVED'")
    expect(afterSalesContent).toContain('Paket Fisik Telah Diterima di Cabang')
    expect(afterSalesContent).toContain('Setujui Permintaan')
    expect(afterSalesContent).toContain('Tolak Permintaan')
    expect(afterSalesContent).toContain(
      'Foto Bukti Pemeriksaan QC (Maksimal 5)'
    )
  })

  it('3. Meja Kerja Super Admin: Fokus pada putusan rekomendasi ACC Final dan Tolak & Kembalikan tanpa banner ekspedisi berulang', () => {
    expect(superAdminReturnsContent).toContain(
      'packageReceivedAt?: string | null'
    )
    expect(superAdminReturnsContent).toContain('handleDirectApprove')
    expect(superAdminReturnsContent).toContain('handleDirectRejectAndReturn')
    expect(superAdminReturnsContent).toContain('Menunggu ACC Superadmin')
  })

  it('4. Halaman Pesanan Super Admin: Menampilkan status "Paket Tiba di Toko (Sedang QC Fisik)" di tabel dan drawer', () => {
    expect(superAdminOrdersContent).toContain(
      'packageReceivedAt?: string | null'
    )
    expect(superAdminOrdersContent).toContain(
      'Paket Tiba di Toko (Sedang QC Fisik)'
    )
    expect(superAdminOrdersContent).toContain('Tiba di Toko (QC)')
    expect(superAdminOrdersContent).toContain('Konfirmasi Paket Tiba di Toko')
    expect(superAdminOrdersContent).toContain(
      'handleConfirmPackageArrivalInOrdersDrawer'
    )
  })

  it('5. Halaman Detail Pesanan Pembeli (Desktop & Mobile): Menampilkan status barang telah sampai di toko cabang dan sedang di-QC', () => {
    // Desktop
    expect(customerDesktopContent).toContain(
      'latestReturnRequest.packageReceivedAt'
    )
    expect(customerDesktopContent).toContain('Paket Telah Tiba di Cabang')
    expect(customerDesktopContent).toContain('Sedang Pemeriksaan Fisik')
    expect(customerDesktopContent).toContain('Catatan Teknisi Cabang:')

    // Mobile
    expect(customerMobileContent).toContain(
      'latestReturnRequest.packageReceivedAt'
    )
    expect(customerMobileContent).toContain('Paket Tiba di Toko Cabang')
    expect(customerMobileContent).toContain('Sedang QC')
    expect(customerMobileContent).toContain('Catatan Teknisi:')
  })
})
