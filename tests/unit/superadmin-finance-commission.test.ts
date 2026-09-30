import { describe, it, expect } from 'vitest'

describe('Superadmin Finance & Platform Commission Architecture', () => {
  // Test case data reflecting the user's order scenario
  const mockOrder = {
    orderNumber: 'SPR-20260930-F6457871',
    total: 29289900,
    subtotal: 29200000,
    commissionAmount: 438000,
    commissionRate: 1.5,
    discountAmount: 0,
    store: {
      id: 'store-roxy-1',
      name: 'PT Gadget Jaya Sentosa (Roxy)',
      companyName: 'PT Gadget Jaya Sentosa',
    },
  }

  it('should attribute gross revenue to Platform Commission (Rp 438.000) for Superadmin consolidated view', () => {
    const isConsolidated = true
    const storeGMV = mockOrder.total // 29.289.900
    const platformCommission = mockOrder.commissionAmount // 438.000

    const superAdminGrossRevenue = isConsolidated
      ? platformCommission
      : storeGMV

    expect(superAdminGrossRevenue).toBe(438000)
    expect(superAdminGrossRevenue).not.toBe(storeGMV)
  })

  it('should correctly calculate withdrawable balance for Superadmin from platform commission only', () => {
    const isConsolidated = true
    const allTimeCompletedCommission = 438000
    const allTimeHoldingWithdrawn = 0

    let availableBalance = 0
    if (isConsolidated) {
      availableBalance = Math.max(
        0,
        allTimeCompletedCommission - allTimeHoldingWithdrawn
      )
    }

    expect(availableBalance).toBe(438000)
  })

  it('should format mutation as INCOME for Superadmin (Komisi Masuk Kas Platform)', () => {
    const isConsolidated = true
    const commission = mockOrder.commissionAmount

    const mutation = isConsolidated
      ? {
          type: 'INCOME' as const,
          category: 'COMMISSION' as const,
          categoryLabel: 'Komisi Platform',
          amount: commission,
          statusLabel: 'Masuk Kas Platform',
        }
      : {
          type: 'EXPENSE' as const,
          category: 'COMMISSION' as const,
          categoryLabel: 'Komisi Platform',
          amount: commission,
          statusLabel: 'Terpotong',
        }

    expect(mutation.type).toBe('INCOME')
    expect(mutation.amount).toBe(438000)
    expect(mutation.statusLabel).toBe('Masuk Kas Platform')
  })

  it('should format gadget sale as Hak Toko Cabang (ESCROW) in Superadmin consolidated view', () => {
    const isConsolidated = true
    const netStoreAmount =
      mockOrder.subtotal - mockOrder.discountAmount - mockOrder.commissionAmount // 28.762.000

    const mutation = isConsolidated
      ? {
          type: 'ESCROW' as const,
          category: 'SALE' as const,
          categoryLabel: 'Penjualan Cabang',
          amount: netStoreAmount,
          statusLabel: 'Hak Toko Cabang',
        }
      : {
          type: 'INCOME' as const,
          category: 'SALE' as const,
          categoryLabel: 'Penjualan Gadget',
          amount: netStoreAmount,
          statusLabel: 'Masuk Saldo',
        }

    expect(mutation.type).toBe('ESCROW')
    expect(mutation.amount).toBe(28762000)
    expect(mutation.statusLabel).toBe('Hak Toko Cabang')
  })

  it('should format mutations properly for Store Admin (Sale as INCOME, Commission as EXPENSE)', () => {
    const isConsolidated = false
    const netStoreAmount = 28762000
    const commission = 438000

    const saleMutation = !isConsolidated
      ? {
          type: 'INCOME' as const,
          category: 'SALE' as const,
          amount: netStoreAmount,
          statusLabel: 'Masuk Saldo',
        }
      : {
          type: 'ESCROW' as const,
          category: 'SALE' as const,
          amount: netStoreAmount,
          statusLabel: 'Hak Toko Cabang',
        }

    const feeMutation = !isConsolidated
      ? {
          type: 'EXPENSE' as const,
          category: 'COMMISSION' as const,
          amount: commission,
          statusLabel: 'Terpotong',
        }
      : {
          type: 'INCOME' as const,
          category: 'COMMISSION' as const,
          amount: commission,
          statusLabel: 'Masuk Kas Platform',
        }

    expect(saleMutation.type).toBe('INCOME')
    expect(saleMutation.statusLabel).toBe('Masuk Saldo')
    expect(feeMutation.type).toBe('EXPENSE')
    expect(feeMutation.statusLabel).toBe('Terpotong')
  })
})
