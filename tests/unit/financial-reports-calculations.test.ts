import { describe, it, expect } from 'vitest'

describe('Financial Reports Gross/Net Profit & COGS Engine (Phase 5)', () => {
  interface MockOrderItem {
    price: number
    costPrice: number
    quantity: number
  }

  interface MockOrder {
    id: string
    orderNumber: string
    commissionAmount: number | null
    discountAmount: number | null
    shippingCost: number | null
    insuranceFee: number | null
    store?: {
      defaultPackingFee: number
    } | null
    items: MockOrderItem[]
  }

  function calculateFinancials(orders: MockOrder[]) {
    let totalGrossRevenue = 0
    let totalCOGS = 0
    let totalPlatformCommission = 0
    let totalPackingCost = 0
    let totalVoucherDiscount = 0
    let totalShippingCost = 0
    let totalInsuranceFee = 0

    orders.forEach((order) => {
      totalPlatformCommission += order.commissionAmount ?? 0
      totalVoucherDiscount += order.discountAmount ?? 0
      totalShippingCost += order.shippingCost ?? 0
      totalInsuranceFee += order.insuranceFee ?? 0

      const packingFee = order.store?.defaultPackingFee ?? 5000
      totalPackingCost += packingFee

      order.items.forEach((item) => {
        const qty = item.quantity || 1
        totalGrossRevenue += item.price * qty
        totalCOGS += (item.costPrice ?? 0) * qty
      })
    })

    const totalGrossProfit = totalGrossRevenue - totalCOGS
    const grossMarginPct =
      totalGrossRevenue > 0
        ? Number(((totalGrossProfit / totalGrossRevenue) * 100).toFixed(2))
        : 0

    const totalEcommerceExpenses =
      totalPlatformCommission + totalPackingCost + totalVoucherDiscount
    const totalNetProfit = totalGrossProfit - totalEcommerceExpenses
    const netMarginPct =
      totalGrossRevenue > 0
        ? Number(((totalNetProfit / totalGrossRevenue) * 100).toFixed(2))
        : 0

    return {
      grossRevenue: totalGrossRevenue,
      cogs: totalCOGS,
      grossProfit: totalGrossProfit,
      grossMarginPct,
      operationalExpenses: {
        platformCommission: totalPlatformCommission,
        packingCost: totalPackingCost,
        voucherDiscount: totalVoucherDiscount,
        shipping: totalShippingCost,
        insurance: totalInsuranceFee,
        total: totalEcommerceExpenses,
      },
      netProfit: totalNetProfit,
      netMarginPct,
    }
  }

  it('should accurately calculate Gross Revenue, COGS, Gross Profit and Gross Margin', () => {
    const orders: MockOrder[] = [
      {
        id: 'ord-1',
        orderNumber: 'ORD-001',
        commissionAmount: 459980, // 2% dari 22.999.000
        discountAmount: 0,
        shippingCost: 35000,
        insuranceFee: 46000,
        store: { defaultPackingFee: 5000 },
        items: [
          {
            price: 22999000,
            costPrice: 20200000,
            quantity: 1,
          },
        ],
      },
    ]

    const result = calculateFinancials(orders)

    expect(result.grossRevenue).toBe(22999000)
    expect(result.cogs).toBe(20200000)
    expect(result.grossProfit).toBe(2799000)
    // 2.799.000 / 22.999.000 * 100 = 12.17%
    expect(result.grossMarginPct).toBe(12.17)
  })

  it('should pass-through shipping and insurance without deducting from store net profit', () => {
    const orders: MockOrder[] = [
      {
        id: 'ord-2',
        orderNumber: 'ORD-002',
        commissionAmount: 400000, // 2%
        discountAmount: 50000, // voucher toko Rp 50.000
        shippingCost: 120000, // Ongkir kurir (pass-through)
        insuranceFee: 40000, // Asuransi wajib (pass-through)
        store: { defaultPackingFee: 5000 },
        items: [
          {
            price: 20000000,
            costPrice: 17500000,
            quantity: 1,
          },
        ],
      },
    ]

    const result = calculateFinancials(orders)

    // Gross Profit: 20.000.000 - 17.500.000 = 2.500.000
    expect(result.grossProfit).toBe(2500000)

    // Beban toko yang dipotong: Komisi (400.000) + Packing (5.000) + Voucher (50.000) = 455.000
    expect(result.operationalExpenses.total).toBe(455000)
    expect(result.operationalExpenses.shipping).toBe(120000)
    expect(result.operationalExpenses.insurance).toBe(40000)

    // Net Profit: 2.500.000 - 455.000 = 2.045.000 (Ongkir 120rb & Asuransi 40rb TIDAK memotong laba toko)
    expect(result.netProfit).toBe(2045000)
    // 2.045.000 / 20.000.000 * 100 = 10.225% -> 10.22%
    expect(result.netMarginPct).toBe(10.22)
  })

  it('should calculate multiple orders aggregation with different quantities and items', () => {
    const orders: MockOrder[] = [
      {
        id: 'ord-3',
        orderNumber: 'ORD-003',
        commissionAmount: 300000,
        discountAmount: 0,
        shippingCost: 25000,
        insuranceFee: 30000,
        store: { defaultPackingFee: 5000 },
        items: [
          { price: 15000000, costPrice: 13000000, quantity: 2 }, // Gross: 30M, Cost: 26M
        ],
      },
      {
        id: 'ord-4',
        orderNumber: 'ORD-004',
        commissionAmount: 200000,
        discountAmount: 20000,
        shippingCost: 15000,
        insuranceFee: 20000,
        store: { defaultPackingFee: 5000 },
        items: [
          { price: 10000000, costPrice: 8500000, quantity: 1 }, // Gross: 10M, Cost: 8.5M
        ],
      },
    ]

    const result = calculateFinancials(orders)

    expect(result.grossRevenue).toBe(40000000)
    expect(result.cogs).toBe(34500000)
    expect(result.grossProfit).toBe(5500000)
    expect(result.operationalExpenses.packingCost).toBe(10000) // 2 orders * 5.000
    expect(result.operationalExpenses.platformCommission).toBe(500000)
    expect(result.operationalExpenses.voucherDiscount).toBe(20000)
    expect(result.operationalExpenses.total).toBe(530000)
    expect(result.netProfit).toBe(5500000 - 530000)
    expect(result.netProfit).toBe(4970000)
  })

  it('should handle zero revenue without NaN or errors', () => {
    const orders: MockOrder[] = []
    const result = calculateFinancials(orders)

    expect(result.grossRevenue).toBe(0)
    expect(result.cogs).toBe(0)
    expect(result.grossProfit).toBe(0)
    expect(result.grossMarginPct).toBe(0)
    expect(result.netProfit).toBe(0)
    expect(result.netMarginPct).toBe(0)
  })

  it('should strictly evaluate CANCELLED and RETURNED orders to Rp 0 for all financial metrics', () => {
    interface ActivityOrder {
      id: string
      orderNumber: string
      status: string
      total: number
      commissionAmount: number | null
      discountAmount: number | null
      shippingCost: number | null
      insuranceFee: number | null
      store?: { defaultPackingFee: number } | null
      items: MockOrderItem[]
    }

    function formatRecentOrderFinancials(order: ActivityOrder) {
      const isCancelled =
        order.status === 'CANCELLED' || order.status === 'RETURNED'

      const grossRevenue = isCancelled
        ? 0
        : order.items.reduce(
            (sum, item) => sum + item.price * (item.quantity || 1),
            0
          )
      const cogs = isCancelled
        ? 0
        : order.items.reduce(
            (sum, item) => sum + (item.costPrice ?? 0) * (item.quantity || 1),
            0
          )
      const grossProfit = isCancelled ? 0 : grossRevenue - cogs
      const grossMarginPct =
        !isCancelled && grossRevenue > 0
          ? Number(((grossProfit / grossRevenue) * 100).toFixed(2))
          : 0
      const platformCommission = isCancelled ? 0 : (order.commissionAmount ?? 0)
      const packingCost = isCancelled
        ? 0
        : (order.store?.defaultPackingFee ?? 5000)
      const voucherDiscount = isCancelled ? 0 : (order.discountAmount ?? 0)
      const totalExpense = isCancelled
        ? 0
        : platformCommission + packingCost + voucherDiscount
      const netProfit = isCancelled ? 0 : grossProfit - totalExpense
      const netMarginPct =
        !isCancelled && grossRevenue > 0
          ? Number(((netProfit / grossRevenue) * 100).toFixed(2))
          : 0

      return {
        grossRevenue,
        cogs,
        grossProfit,
        grossMarginPct,
        platformCommission,
        packingCost,
        voucherDiscount,
        shippingCost: isCancelled ? 0 : (order.shippingCost ?? 0),
        insuranceFee: isCancelled ? 0 : (order.insuranceFee ?? 0),
        totalExpense,
        netProfit,
        netMarginPct,
      }
    }

    // Order CANCELLED persis seperti pada screenshot (iPhone 16 Pro Max Rp 29.200.000)
    const cancelledOrder: ActivityOrder = {
      id: 'ord-cancelled',
      orderNumber: 'SPR-20260930-F004E40E',
      status: 'CANCELLED',
      total: 29200000,
      commissionAmount: 438000,
      discountAmount: 0,
      shippingCost: 35000,
      insuranceFee: 58400,
      store: { defaultPackingFee: 5000 },
      items: [
        {
          price: 29200000,
          costPrice: 27000000,
          quantity: 1,
        },
      ],
    }

    const cancelledFin = formatRecentOrderFinancials(cancelledOrder)

    expect(cancelledFin.grossRevenue).toBe(0)
    expect(cancelledFin.cogs).toBe(0)
    expect(cancelledFin.grossProfit).toBe(0)
    expect(cancelledFin.grossMarginPct).toBe(0)
    expect(cancelledFin.platformCommission).toBe(0)
    expect(cancelledFin.packingCost).toBe(0)
    expect(cancelledFin.totalExpense).toBe(0)
    expect(cancelledFin.shippingCost).toBe(0)
    expect(cancelledFin.insuranceFee).toBe(0)
    expect(cancelledFin.netProfit).toBe(0)
    expect(cancelledFin.netMarginPct).toBe(0)

    // Order COMPLETED harus menghitung normal
    const completedOrder: ActivityOrder = {
      id: 'ord-completed',
      orderNumber: 'SPR-20261001-7298F9EA',
      status: 'COMPLETED',
      total: 5199000,
      commissionAmount: 77985,
      discountAmount: 0,
      shippingCost: 20000,
      insuranceFee: 10398,
      store: { defaultPackingFee: 5000 },
      items: [
        {
          price: 5199000,
          costPrice: 4200000,
          quantity: 1,
        },
      ],
    }

    const completedFin = formatRecentOrderFinancials(completedOrder)

    expect(completedFin.grossRevenue).toBe(5199000)
    expect(completedFin.cogs).toBe(4200000)
    expect(completedFin.grossProfit).toBe(999000)
    expect(completedFin.totalExpense).toBe(77985 + 5000) // 82985
    expect(completedFin.netProfit).toBe(999000 - 82985) // 916015
  })
})
