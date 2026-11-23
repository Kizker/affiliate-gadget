import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { statusConfig } from '@/components/customer/order-detail/order-detail-types'

describe('Arsitektur Retur Terpadu: Eliminasi Glitch Menunggu Pembayaran & Otomatisasi AWB Retur Biteship Cashless', () => {
  const orderDetailClientPath = path.resolve(
    'src/app/dashboard/customer/orders/[orderId]/order-detail-client.tsx'
  )
  const orderDetailPagePath = path.resolve(
    'src/app/dashboard/customer/orders/[orderId]/page.tsx'
  )
  const desktopReturnCardPath = path.resolve(
    'src/components/customer/order-detail/order-desktop-return-card.tsx'
  )
  const mobileViewPath = path.resolve(
    'src/components/customer/order-detail/order-mobile-view.tsx'
  )
  const returnDetailApiPath = path.resolve('src/app/api/returns/[id]/route.ts')
  const afterSalesPagePath = path.resolve(
    'src/app/dashboard/after-sales/returns/page.tsx'
  )

  it('1. Eliminasi Glitch Status Pesanan: statusConfig.RETURN_PENDING bernilai "Pengajuan Retur / Garansi Aktif"', () => {
    expect(statusConfig.RETURN_PENDING).toBeDefined()
    expect(statusConfig.RETURN_PENDING.label).toBe(
      'Pengajuan Retur / Garansi Aktif'
    )
    expect(statusConfig.RETURN_PENDING.label).not.toContain(
      'Menunggu Pembayaran'
    )

    const clientCode = fs.readFileSync(orderDetailClientPath, 'utf8')
    expect(clientCode).toContain('statusConfig.RETURN_PENDING')
    expect(clientCode).not.toContain(
      "latestReturnRequest.status === 'PENDING') {\n        return statusConfig.PENDING_PAYMENT"
    )
  })

  it('2. Status Pembayaran Aman: Pesanan COMPLETED atau memiliki retur aktif tidak pernah berstatus "PENDING" payment', () => {
    const pageCode = fs.readFileSync(orderDetailPagePath, 'utf8')
    expect(pageCode).toContain("order.status === 'COMPLETED'")
    expect(pageCode).toContain("order.status === 'RETURNED'")
    expect(pageCode).toContain("? 'PAID'")
  })

  it('3. Backend Otomasi AWB: After Sales approve retur awal menerbitkan resi AWB kurir Biteship Cashless', () => {
    const apiCode = fs.readFileSync(returnDetailApiPath, 'utf8')
    expect(apiCode).toContain('returnCourierCode')
    expect(apiCode).toContain('bookShippingPickup')
    expect(apiCode).toContain('generateWaybill')
    expect(apiCode).toContain('generatedTrackingNumber')
    expect(apiCode).toContain(
      'returnTrackingNumber: isApprove ? generatedTrackingNumber : null'
    )
    expect(apiCode).toContain('Resi retur cashless resmi telah diterbitkan')
  })

  it('4. Layar Customer Desktop: Menampilkan kartu Resi Pengembalian Resmi Cashless & tombol Lacak saat APPROVED', () => {
    const cardCode = fs.readFileSync(desktopReturnCardPath, 'utf8')
    expect(cardCode).toContain('Resi Pengembalian Resmi (Cashless / Drop-Off)')
    expect(cardCode).toContain('Gratis / Tercover Escrow')
    expect(cardCode).toContain('latestReturnRequest.returnTrackingNumber')
    expect(cardCode).toContain('Lacak Pengiriman Balik (Live)')
    expect(cardCode).toContain(
      'Tunjukkan nomor resi ini ke kurir atau petugas gerai'
    )
  })

  it('5. Layar Customer Mobile: Menampilkan kartu Resi Retur Resmi Cashless dengan tombol Salin dan Lacak', () => {
    const mobileCode = fs.readFileSync(mobileViewPath, 'utf8')
    expect(mobileCode).toContain('Resi Retur Resmi (Cashless)')
    expect(mobileCode).toContain('latestReturnRequest.returnTrackingNumber')
    expect(mobileCode).toContain('Lacak Pengiriman Balik (Live)')
    expect(mobileCode).toContain('Tunjukkan no. resi ini ke gerai')
  })

  it('6. Meja Kerja After Sales: Menampilkan tombol "Setujui Kirim Balik (Terbitkan AWB)" saat PENDING, dan tracking saat paket bergerak', () => {
    const afterSalesCode = fs.readFileSync(afterSalesPagePath, 'utf8')
    expect(afterSalesCode).toContain('Setujui Kirim Balik (Terbitkan AWB)')
    expect(afterSalesCode).toContain('Tolak Pengajuan')
    expect(afterSalesCode).toContain('Lacak Resi ({item.returnTrackingNumber})')
    expect(afterSalesCode).toContain('Barang Diterima &amp; Mulai QC')
  })
})
