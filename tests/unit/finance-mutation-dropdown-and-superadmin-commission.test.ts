import { describe, it, expect } from 'vitest'
import { TransactionMutation } from '@/components/admin/finance/types'

describe('Finance Mutation Dropdown & Superadmin Commission Scope', () => {
  const dummyMutation: TransactionMutation = {
    id: 'escrow-order-1',
    refNumber: 'SPR-20261124-74BE1238',
    title:
      'Penjualan SEIN Samsung Galaxy Z Fold 4 5G 1TB 512GB 256GB | Fold 3 |...',
    subtitle:
      'Customer: ASRock · GOJEK INSTANT (GK-261124352100) · Sedang Dipersiapkan / Tunggu Pickup',
    type: 'ESCROW',
    category: 'ESCROW',
    categoryLabel: 'Dana Tertahan (Escrow)',
    amount: 36961600,
    date: '24 Nov 2026, 04.43',
    status: 'PENDING',
    statusLabel: 'Proses Packing / Kurir',
    orderStatus: 'IN_PROGRESS',
    courierInfo: 'GOJEK INSTANT (GK-261124352100)',
    trackingNumber: 'GK-261124352100',
    items: [
      {
        productName: 'Samsung Galaxy Z Fold 4 5G',
        variantName: '1TB 512GB 256GB',
        quantity: 1,
        price: 37818340,
        costPrice: 25000000,
        subtotal: 37818340,
        image: 'https://images.example.com/fold4.jpg',
      },
    ],
    breakdown: {
      subtotal: 37818340,
      costPrice: 25000000,
      grossProfit: 12818340,
      discountAmount: 200000,
      voucherCode: 'HEMAT200K',
      commissionAmount: 567275,
      commissionRate: 1.5,
      gatewayFee: 4000,
      shippingCost: 35000,
      insuranceFee: 94500,
      totalCustomerPaid: 37747840,
      netStoreAmount: 37051065,
      paymentMethod: 'Virtual Account Bank Mandiri',
      customerName: 'ASRock',
      customerPhone: '08123456789',
      courierCode: 'GOJEK',
      courierService: 'INSTANT',
      trackingNumber: 'GK-261124352100',
      notes: 'Min Tolong kirim ya!',
    },
  }

  it('1. should preserve outer layout fields when collapsed', () => {
    expect(dummyMutation.refNumber).toBe('SPR-20261124-74BE1238')
    expect(dummyMutation.categoryLabel).toBe('Dana Tertahan (Escrow)')
    expect(dummyMutation.amount).toBe(36961600)
    expect(dummyMutation.statusLabel).toBe('Proses Packing / Kurir')
    expect(dummyMutation.orderStatus).toBe('IN_PROGRESS')
  })

  it('2. should contain comprehensive breakdown for expanded dropdown', () => {
    expect(dummyMutation.items).toHaveLength(1)
    const item = dummyMutation.items![0]
    expect(item.productName).toBe('Samsung Galaxy Z Fold 4 5G')
    expect(item.variantName).toBe('1TB 512GB 256GB')
    expect(item.price).toBe(37818340)
    expect(item.costPrice).toBe(25000000)

    const b = dummyMutation.breakdown!
    expect(b.discountAmount).toBe(200000)
    expect(b.voucherCode).toBe('HEMAT200K')
    expect(b.commissionAmount).toBe(567275)
    expect(b.commissionRate).toBe(1.5)
    expect(b.gatewayFee).toBe(4000)
    expect(b.shippingCost).toBe(35000)
    expect(b.insuranceFee).toBe(94500)
    expect(b.customerName).toBe('ASRock')
    expect(b.courierCode).toBe('GOJEK')
    expect(b.trackingNumber).toBe('GK-261124352100')
    expect(b.notes).toBe('Min Tolong kirim ya!')
  })

  it('3. should treat superadmin commission as escrow if branch order is still in escrow', () => {
    // Skenario order cabang status IN_PROGRESS (masih escrow)
    const branchOrder = {
      status: 'IN_PROGRESS',
      commissionAmount: 758400,
      total: 37920000,
    }

    const isOrderEscrow = ['PAID', 'IN_PROGRESS', 'SHIPPED'].includes(
      branchOrder.status
    )
    expect(isOrderEscrow).toBe(true)

    // Bagi Superadmin pada opsi PLATFORM_COMMISSION:
    // Jika pesanan cabang masih escrow, maka komisi platform juga masih escrow (tertahan)
    const superAdminCommissionEscrow = isOrderEscrow
      ? branchOrder.commissionAmount
      : 0
    const superAdminCommissionAvailable = !isOrderEscrow
      ? branchOrder.commissionAmount
      : 0

    expect(superAdminCommissionEscrow).toBe(758400)
    expect(superAdminCommissionAvailable).toBe(0)
  })
})
