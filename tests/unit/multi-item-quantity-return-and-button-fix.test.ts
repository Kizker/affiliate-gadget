import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Multi-Item & Quantity-Based Return Flow Suite', () => {
  it('1. order-detail-client.tsx menghitung isCompleted berdasarkan status pesanan yang diterima tanpa menuntut garansi habis', () => {
    const filePath = path.join(
      process.cwd(),
      'src/app/dashboard/customer/orders/[orderId]/order-detail-client.tsx'
    )
    const content = fs.readFileSync(filePath, 'utf-8')

    // isCompleted harus true saat status COMPLETED atau customerConfirmedAt ada
    expect(content).toContain("order.status === 'COMPLETED'")
    expect(content).toContain('Boolean(order.customerConfirmedAt)')
    // Tidak boleh menuntut isWarrantyOver untuk menandakan pesanan selesai
    expect(content).not.toContain(
      "(order.status === 'COMPLETED' && (order.completedAt || isWarrantyOver))"
    )
  })

  it('2. order-desktop-payment-card.tsx selalu menampilkan tombol Ajukan Komplain / Klaim Garansi untuk pesanan multi-item', () => {
    const filePath = path.join(
      process.cwd(),
      'src/components/customer/order-detail/order-desktop-payment-card.tsx'
    )
    const content = fs.readFileSync(filePath, 'utf-8')

    // Tombol Ajukan Komplain / Klaim Garansi tidak boleh dibatasi order.items.length <= 1
    expect(content).not.toContain(
      'order.items.length <= 1 && (\n          <>\n            {canManuallyComplete'
    )
    expect(content).toContain(
      'canRequestReturnOrComplaint && !hasActiveClaim && ('
    )
    expect(content).toContain('Ajukan Komplain / Klaim Garansi')
  })

  it('3. order-desktop-items-card.tsx menyediakan tombol Ajukan Retur Unit Ini pada tiap baris produk', () => {
    const filePath = path.join(
      process.cwd(),
      'src/components/customer/order-detail/order-desktop-items-card.tsx'
    )
    const content = fs.readFileSync(filePath, 'utf-8')

    expect(content).toContain('Ajukan Retur Unit Ini')
    expect(content).toContain('onOpenReturnForItem?.(item)')
  })

  it('4. ReturnModal menyediakan pilihan cepat untuk meretur 1 unit, keduanya, ketiganya, atau semua unit', () => {
    const filePath = path.join(
      process.cwd(),
      'src/components/customer/return-modal.tsx'
    )
    const content = fs.readFileSync(filePath, 'utf-8')

    expect(content).toContain('Jumlah Unit Diretur:')
    expect(content).toContain('1 Unit Saja')
    expect(content).toContain('Keduanya (2 Unit)')
    expect(content).toContain('safeReturnQty')
    expect(content).toContain('maxItemQty')
    expect(content).toContain('isPartialReturn')
  })

  it('5. ReturnModal menghitung dana pengembalian bersih 100% senilai barang yang diretur saat retur parsial', () => {
    const filePath = path.join(
      process.cwd(),
      'src/components/customer/return-modal.tsx'
    )
    const content = fs.readFileSync(filePath, 'utf-8')

    // Pada retur parsial, netRefundAmount = effectiveProductTotal tanpa potongan ongkir atau operational fee
    expect(content).toContain('netRefundAmount: effectiveProductTotal')
  })

  it('6. Backend API /api/returns menerapkan refund penuh tanpa potongan operasional untuk retur parsial', () => {
    const filePath = path.join(process.cwd(), 'src/app/api/returns/route.ts')
    const content = fs.readFileSync(filePath, 'utf-8')

    expect(content).toContain('isPartialOrder')
    expect(content).toContain('netRefundAmount: effectiveItemTotal')
  })

  it('7. Backend API /api/returns/[id] tidak membatalkan status pesanan induk jika hanya retur sebagian unit', () => {
    const filePath = path.join(
      process.cwd(),
      'src/app/api/returns/[id]/route.ts'
    )
    const content = fs.readFileSync(filePath, 'utf-8')

    expect(content).toContain('isPartialOrderRefund')
    expect(content).toContain('status: isPartialOrderRefund')
  })
})
