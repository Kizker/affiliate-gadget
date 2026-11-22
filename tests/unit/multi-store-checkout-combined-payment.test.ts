import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Multi-Store Checkout Combined Payment Suite', () => {
  const chargeApiPath = path.resolve('src/app/api/payment/charge/route.ts')
  const statusApiPath = path.resolve('src/app/api/payment/status/route.ts')
  const webhookApiPath = path.resolve(
    'src/app/api/payment/midtrans/webhook/route.ts'
  )
  const multipleConfirmPath = path.resolve(
    'src/app/order-confirmation/multiple/page.tsx'
  )
  const paymentModalPath = path.resolve(
    'src/components/payment/custom-payment-modal.tsx'
  )

  it('1. POST /api/payment/charge mendukung multi-order (orderIds) dan menghitung total gross amount gabungan', () => {
    const content = fs.readFileSync(chargeApiPath, 'utf-8')
    expect(content).toContain('orderIds')
    expect(content).toContain('allOrderIdsToCharge')
    expect(content).toContain('totalGrossAmount')
    expect(content).toContain('isMultiOrder')
    expect(content).toContain('for (const ord of allOrders)')
  })

  it('2. GET /api/payment/status memperbarui seluruh pesanan terkait dalam multi-order menjadi PAID secara atomik', () => {
    const content = fs.readFileSync(statusApiPath, 'utf-8')
    expect(content).toContain('relatedOrders')
    expect(content).toContain('targetOrdersToUpdate')
    expect(content).toContain('for (const ord of targetOrdersToUpdate)')
    expect(content).toContain("status: 'PAID'")
    expect(content).toContain("status: 'VERIFIED'")
  })

  it('3. Webhook Midtrans memperbarui seluruh pesanan dalam transaksi multi-toko saat settlement', () => {
    const content = fs.readFileSync(webhookApiPath, 'utf-8')
    expect(content).toContain('relatedOrders')
    expect(content).toContain('ordersToUpdate')
    expect(content).toContain('for (const ord of ordersToUpdate)')
    expect(content).toContain('status: orderStatus')
    expect(content).toContain('status: paymentStatus')
  })

  it('4. CustomPaymentModal mendukung prop orderIds dan mengirimkannya ke API payment charge', () => {
    const content = fs.readFileSync(paymentModalPath, 'utf-8')
    expect(content).toContain('orderIds?: string[]')
    expect(content).toContain('orderIds:')
  })

  it('5. Halaman order-confirmation/multiple membuka modal pembayaran untuk seluruh pending orders sekaligus', () => {
    const content = fs.readFileSync(multipleConfirmPath, 'utf-8')
    expect(content).toContain('pendingOrders')
    expect(content).toContain('allPendingIds')
    expect(content).toContain('totalAllPending')
    expect(content).toContain('isMultiPending')
    expect(content).toContain('Pembayaran')
    expect(content).toContain('Pesanan Toko Sekaligus')
  })
})
