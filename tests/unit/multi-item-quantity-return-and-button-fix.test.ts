import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Multi-Item & Quantity-Based Return Flow Suite', () => {
  it('1. order-detail-client.tsx membedakan isReceived (diterima & garansi aktif) dan isCompleted (pesanan selesai & baru boleh ulasan)', () => {
    const filePath = path.join(
      process.cwd(),
      'src/app/dashboard/customer/orders/[orderId]/order-detail-client.tsx'
    )
    const content = fs.readFileSync(filePath, 'utf-8')

    // isReceived true saat customerConfirmedAt ada
    expect(content).toContain('const isReceived = Boolean(')
    expect(content).toContain('order.customerConfirmedAt')
    // isCompleted hanya true saat status COMPLETED, completedAt ada, atau garansi 30 hari sudah lewat
    expect(content).toContain("order.status === 'COMPLETED'")
    expect(content).toContain('Boolean(order.completedAt)')
    expect(content).toContain(
      '(Boolean(order.customerConfirmedAt) && isWarrantyOver)'
    )
  })

  it('2. order-desktop-payment-card.tsx menampilkan tombol Selesaikan Pesanan dan Ajukan Komplain / Klaim Garansi', () => {
    const filePath = path.join(
      process.cwd(),
      'src/components/customer/order-detail/order-desktop-payment-card.tsx'
    )
    const content = fs.readFileSync(filePath, 'utf-8')

    expect(content).toContain('Selesaikan Pesanan')
    expect(content).not.toContain('Selesaikan Pesanan Manual')
    expect(content).toContain(
      'canRequestReturnOrComplaint && !hasActiveClaim && ('
    )
    expect(content).toContain('Ajukan Komplain / Klaim Garansi')
  })

  it('3. order-desktop-items-card.tsx menampilkan Ajukan Retur Unit Ini saat garansi aktif dan menyembunyikan Beri Ulasan hingga pesanan diselesaikan', () => {
    const filePath = path.join(
      process.cwd(),
      'src/components/customer/order-detail/order-desktop-items-card.tsx'
    )
    const content = fs.readFileSync(filePath, 'utf-8')

    expect(content).toContain('Ajukan Retur Unit Ini')
    expect(content).toContain('onOpenReturnForItem?.(item)')
    expect(content).toMatch(
      /isCompleted[\s\S]*!isItemClaimActive[\s\S]*!isItemRejected/
    )
  })

  it('4. ReturnModal menggunakan stepper angka (- / +) saja tanpa pill opsi tambahan dan tanpa box keterangan dana', () => {
    const filePath = path.join(
      process.cwd(),
      'src/components/customer/return-modal.tsx'
    )
    const content = fs.readFileSync(filePath, 'utf-8')

    expect(content).toContain('Jumlah Unit Diretur:')
    expect(content).toContain('safeReturnQty')
    expect(content).toContain('maxItemQty')
    expect(content).toContain('isPartialReturn')
    expect(content).not.toContain('1 Unit Saja')
    expect(content).not.toContain('Keduanya (2 Unit)')
    expect(content).not.toContain(
      'lainnya tetap menjadi milik Anda dan dana barang tersebut tidak ditarik.'
    )
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

  it('6. Backend API /api/returns mengizinkan retur untuk pesanan yang sudah diterima (customerConfirmedAt) dan menolak jika sudah diselesaikan (completedAt)', () => {
    const filePath = path.join(process.cwd(), 'src/app/api/returns/route.ts')
    const content = fs.readFileSync(filePath, 'utf-8')

    expect(content).toContain('isOrderReceived')
    expect(content).toContain('Boolean(order.customerConfirmedAt)')
    expect(content).toContain(
      "if (order.status === 'COMPLETED' && order.completedAt)"
    )
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
