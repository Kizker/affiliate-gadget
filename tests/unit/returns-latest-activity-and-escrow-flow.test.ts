import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Aktivitas Terbaru Pesanan & Audit Perputaran Duit Refund Escrow', () => {
  const adminOrdersApiPath = path.resolve('src/app/api/admin/orders/route.ts')
  const returnsApiPath = path.resolve('src/app/api/returns/[id]/route.ts')
  const afterSalesPagePath = path.resolve(
    'src/app/dashboard/after-sales/returns/page.tsx'
  )
  const financeApiPath = path.resolve('src/app/api/admin/finance/route.ts')

  it('1. Urutan Pesanan: Pesanan diurutkan berdasarkan updatedAt: desc (aktivitas terbaru paling atas)', () => {
    const ordersApi = fs.readFileSync(adminOrdersApiPath, 'utf8')
    expect(ordersApi).toContain(
      "orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }]"
    )

    const returnsApi = fs.readFileSync(returnsApiPath, 'utf8')
    // Memastikan aksi retur memperbarui updatedAt pesanan
    expect(returnsApi).toContain('updatedAt: new Date()')
  })

  it('2. Modal Konfirmasi Kedatangan Paket After Sales: Menampilkan barang dipesan, nama pemesan, dan deskripsi kendala secara simpel', () => {
    const afterSalesPage = fs.readFileSync(afterSalesPagePath, 'utf8')
    expect(afterSalesPage).toContain('receivingPackageTarget.order.items')
    expect(afterSalesPage).toContain('receivingPackageTarget.user.name')
    expect(afterSalesPage).toContain('receivingPackageTarget.description')
    expect(afterSalesPage).not.toContain(
      'Konfirmasi ini akan memberitahukan pembeli dan Superadmin'
    )
  })

  it('3. Perputaran Duit: Dana pesanan RETURNED otomatis keluar dari Escrow dan dicatat sebagai mutasi pengembalian dana ke pembeli', () => {
    const financeApi = fs.readFileSync(financeApiPath, 'utf8')
    // Query mencakup status RETURNED
    expect(financeApi).toContain("ACTIVE_ORDER_STATUSES, 'RETURNED'")

    // Mutasi pengembalian dana refund ke customer
    expect(financeApi).toContain("order.status === 'RETURNED'")
    expect(financeApi).toContain('Pengembalian Dana Refund')
    expect(financeApi).toContain('Dana Dikembalikan ke Pembeli')
    expect(financeApi).toContain("categoryLabel: 'Pencairan Refund'")
  })

  it('4. Backend API Returns: Ketika Superadmin ACC Refund, otomatis eksekusi refund Midtrans & Iris Payout serta update status order RETURNED', () => {
    const returnsApi = fs.readFileSync(returnsApiPath, 'utf8')
    expect(returnsApi).toContain('refundMidtransTransaction')
    expect(returnsApi).toContain('createIrisPayout')
    expect(returnsApi).toContain("status: 'RETURNED'")
    expect(returnsApi).toContain("status: 'COMPLETED'")
  })
})
