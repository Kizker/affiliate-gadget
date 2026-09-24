import { describe, it, expect } from 'vitest'

describe('Financial Reports Export Engine (Phase 8 - XLSX & CSV)', () => {
  const EXPECTED_FINANCIAL_HEADERS = [
    'No',
    'Nomor Pesanan',
    'Toko / PT Cabang',
    'Tanggal',
    'Status',
    'Produk',
    'Qty',
    'Omzet Kotor (Rp)',
    'DPP (Rp)',
    'PPN 11% (Rp)',
    'Skema PPN',
    'HPP Modal (Rp)',
    'Laba Kotor (Rp)',
    'Margin Kotor (%)',
    'Komisi Platform (Rp)',
    'Biaya Packing (Rp)',
    'Diskon Voucher (Rp)',
    'Ongkir Pass-Through (Rp)',
    'Asuransi Pass-Through (Rp)',
    'Laba Bersih Toko (Rp)',
    'Margin Bersih (%)',
  ]

  interface MockExportOrderItem {
    productName: string
    price: number
    costPrice: number
    quantity: number
  }

  interface MockExportOrder {
    id: string
    orderNumber: string
    storeId: string
    storeName: string
    createdAt: string
    status: string
    commissionAmount: number
    packingFee: number
    discountAmount: number
    shippingCost: number
    insuranceFee: number
    tax?: number
    dppAmount?: number
    taxTypeApplied?: string
    items: MockExportOrderItem[]
  }

  function generateFinancialExportRows(orders: MockExportOrder[]) {
    let sumGross = 0
    let sumDpp = 0
    let sumPpn = 0
    let sumCOGS = 0
    let sumGrossProfit = 0
    let sumCommission = 0
    let sumPacking = 0
    let sumVoucher = 0
    let sumShipping = 0
    let sumInsurance = 0
    let sumNetProfit = 0
    let sumQty = 0

    const rows = orders.map((order, index) => {
      const grossRevenue = order.items.reduce(
        (sum, item) => sum + item.price * (item.quantity || 1),
        0
      )
      const cogs = order.items.reduce(
        (sum, item) => sum + (item.costPrice ?? 0) * (item.quantity || 1),
        0
      )
      const grossProfit = grossRevenue - cogs
      const grossMargin =
        grossRevenue > 0
          ? Number(((grossProfit / grossRevenue) * 100).toFixed(2))
          : 0

      const ppn = order.tax ?? 0
      const dpp =
        order.dppAmount && order.dppAmount > 0
          ? order.dppAmount
          : ppn > 0
            ? Math.max(0, grossRevenue - ppn)
            : grossRevenue
      const taxScheme =
        order.taxTypeApplied === 'INCLUSIVE' || ppn > 0 ? 'Inklusif' : 'Non-PKP'

      const commission = order.commissionAmount ?? 0
      const packing = order.packingFee ?? 5000
      const discount = order.discountAmount ?? 0
      const shipping = order.shippingCost ?? 0
      const insurance = order.insuranceFee ?? 0

      const totalExpense = commission + packing + discount
      const netProfit = grossProfit - totalExpense
      const netMargin =
        grossRevenue > 0
          ? Number(((netProfit / grossRevenue) * 100).toFixed(2))
          : 0

      const totalQty = order.items.reduce(
        (sum, item) => sum + (item.quantity || 1),
        0
      )

      sumGross += grossRevenue
      sumDpp += dpp
      sumPpn += ppn
      sumCOGS += cogs
      sumGrossProfit += grossProfit
      sumCommission += commission
      sumPacking += packing
      sumVoucher += discount
      sumShipping += shipping
      sumInsurance += insurance
      sumNetProfit += netProfit
      sumQty += totalQty

      const productNames = order.items.map((i) => i.productName).join('; ')

      return [
        index + 1,
        order.orderNumber,
        order.storeName,
        order.createdAt,
        order.status,
        productNames,
        totalQty,
        grossRevenue,
        dpp,
        ppn,
        taxScheme,
        cogs,
        grossProfit,
        grossMargin,
        commission,
        packing,
        discount,
        shipping,
        insurance,
        netProfit,
        netMargin,
      ]
    })

    if (orders.length > 0) {
      const totalGrossMargin =
        sumGross > 0
          ? Number(((sumGrossProfit / sumGross) * 100).toFixed(2))
          : 0
      const totalNetMargin =
        sumGross > 0 ? Number(((sumNetProfit / sumGross) * 100).toFixed(2)) : 0

      rows.push([
        'TOTAL',
        '-',
        '-',
        '-',
        '-',
        '-',
        sumQty,
        sumGross,
        sumDpp,
        sumPpn,
        '-',
        sumCOGS,
        sumGrossProfit,
        totalGrossMargin,
        sumCommission,
        sumPacking,
        sumVoucher,
        sumShipping,
        sumInsurance,
        sumNetProfit,
        totalNetMargin,
      ])
    }

    return {
      headers: EXPECTED_FINANCIAL_HEADERS,
      rows,
      summary: {
        sumQty,
        sumGross,
        sumDpp,
        sumPpn,
        sumCOGS,
        sumGrossProfit,
        sumCommission,
        sumPacking,
        sumVoucher,
        sumShipping,
        sumInsurance,
        sumNetProfit,
      },
    }
  }

  it('should define exactly 21 comprehensive financial columns in export sheet', () => {
    expect(EXPECTED_FINANCIAL_HEADERS).toHaveLength(21)
    expect(EXPECTED_FINANCIAL_HEADERS).toContain('Omzet Kotor (Rp)')
    expect(EXPECTED_FINANCIAL_HEADERS).toContain('DPP (Rp)')
    expect(EXPECTED_FINANCIAL_HEADERS).toContain('PPN 11% (Rp)')
    expect(EXPECTED_FINANCIAL_HEADERS).toContain('Skema PPN')
    expect(EXPECTED_FINANCIAL_HEADERS).toContain('HPP Modal (Rp)')
    expect(EXPECTED_FINANCIAL_HEADERS).toContain('Laba Kotor (Rp)')
    expect(EXPECTED_FINANCIAL_HEADERS).toContain('Margin Kotor (%)')
    expect(EXPECTED_FINANCIAL_HEADERS).toContain('Komisi Platform (Rp)')
    expect(EXPECTED_FINANCIAL_HEADERS).toContain('Biaya Packing (Rp)')
    expect(EXPECTED_FINANCIAL_HEADERS).toContain('Diskon Voucher (Rp)')
    expect(EXPECTED_FINANCIAL_HEADERS).toContain('Ongkir Pass-Through (Rp)')
    expect(EXPECTED_FINANCIAL_HEADERS).toContain('Asuransi Pass-Through (Rp)')
    expect(EXPECTED_FINANCIAL_HEADERS).toContain('Laba Bersih Toko (Rp)')
    expect(EXPECTED_FINANCIAL_HEADERS).toContain('Margin Bersih (%)')
  })

  it('should correctly calculate and map order row without deducting shipping or insurance from net profit', () => {
    const orders: MockExportOrder[] = [
      {
        id: 'ord-101',
        orderNumber: 'ORD-IPHONE15-01',
        storeId: 'store-roxy',
        storeName: 'PT Gadget Jaya Sentosa - Roxy Mas Pusat',
        createdAt: '2026-09-22 10:00',
        status: 'Selesai',
        commissionAmount: 399980, // 2% dari 19.999.000
        packingFee: 5000,
        discountAmount: 50000,
        shippingCost: 35000,
        insuranceFee: 40000,
        items: [
          {
            productName: 'iPhone 15 Pro 128GB Natural Titanium',
            price: 19999000,
            costPrice: 17500000,
            quantity: 1,
          },
        ],
      },
    ]

    const result = generateFinancialExportRows(orders)
    const firstRow = result.rows[0]

    expect(firstRow[0]).toBe(1) // No
    expect(firstRow[1]).toBe('ORD-IPHONE15-01')
    expect(firstRow[2]).toBe('PT Gadget Jaya Sentosa - Roxy Mas Pusat')
    expect(firstRow[6]).toBe(1) // Qty
    expect(firstRow[7]).toBe(19999000) // Gross
    expect(firstRow[8]).toBe(19999000) // DPP
    expect(firstRow[9]).toBe(0) // PPN
    expect(firstRow[10]).toBe('Non-PKP') // Skema PPN
    expect(firstRow[11]).toBe(17500000) // COGS
    expect(firstRow[12]).toBe(2499000) // Gross Profit = 19.999.000 - 17.500.000
    expect(firstRow[13]).toBe(12.5) // Margin Kotor % = (2499000 / 19999000) * 100 = 12.50%
    expect(firstRow[14]).toBe(399980) // Komisi 2%
    expect(firstRow[15]).toBe(5000) // Packing flat
    expect(firstRow[16]).toBe(50000) // Voucher
    expect(firstRow[17]).toBe(35000) // Shipping pass-through
    expect(firstRow[18]).toBe(40000) // Insurance pass-through

    // Total expense = 399.980 + 5.000 + 50.000 = 454.980
    // Net profit = 2.499.000 - 454.980 = 2.044.020 (Shipping & insurance NOT deducted)
    expect(firstRow[19]).toBe(2044020)
    expect(firstRow[20]).toBe(10.22) // Net Margin % = (2044020 / 19999000) * 100
  })

  it('should generate accurate summary TOTAL row at the bottom for multi-order datasets', () => {
    const orders: MockExportOrder[] = [
      {
        id: 'ord-1',
        orderNumber: 'ORD-1',
        storeId: 'store-roxy',
        storeName: 'PT Gadget Jaya Sentosa',
        createdAt: '2026-09-22',
        status: 'Selesai',
        commissionAmount: 200000,
        packingFee: 5000,
        discountAmount: 0,
        shippingCost: 30000,
        insuranceFee: 20000,
        items: [
          {
            productName: 'HP A',
            price: 10000000,
            costPrice: 8500000,
            quantity: 1,
          },
        ],
      },
      {
        id: 'ord-2',
        orderNumber: 'ORD-2',
        storeId: 'store-surabaya',
        storeName: 'PT Sinar Gadget Nusantara',
        createdAt: '2026-09-22',
        status: 'Selesai',
        commissionAmount: 400000,
        packingFee: 5000,
        discountAmount: 100000,
        shippingCost: 45000,
        insuranceFee: 40000,
        items: [
          {
            productName: 'HP B',
            price: 10000000,
            costPrice: 8500000,
            quantity: 2,
          },
        ],
      },
    ]

    const result = generateFinancialExportRows(orders)
    expect(result.rows).toHaveLength(3) // 2 data rows + 1 total row

    const totalRow = result.rows[2]
    expect(totalRow[0]).toBe('TOTAL')
    expect(totalRow[6]).toBe(3) // Total Qty (1 + 2)
    expect(totalRow[7]).toBe(30000000) // Total Gross = 10jt + 20jt
    expect(totalRow[8]).toBe(30000000) // Total DPP
    expect(totalRow[9]).toBe(0) // Total PPN
    expect(totalRow[10]).toBe('-') // Skema PPN
    expect(totalRow[11]).toBe(25500000) // Total COGS = 8.5jt + 17jt
    expect(totalRow[12]).toBe(4500000) // Total Gross Profit = 30jt - 25.5jt
    expect(totalRow[13]).toBe(15) // Weighted Gross Margin % = (4.5jt / 30jt) * 100 = 15%
    expect(totalRow[14]).toBe(600000) // Total Commission
    expect(totalRow[15]).toBe(10000) // Total Packing (5rb * 2)
    expect(totalRow[16]).toBe(100000) // Total Voucher
    expect(totalRow[17]).toBe(75000) // Total Shipping pass-through
    expect(totalRow[18]).toBe(60000) // Total Insurance pass-through

    // Total expenses = 600.000 + 10.000 + 100.000 = 710.000
    // Total Net Profit = 4.500.000 - 710.000 = 3.790.000
    expect(totalRow[19]).toBe(3790000)
    // Weighted Net Margin % = (3.790.000 / 30.000.000) * 100 = 12.63%
    expect(totalRow[20]).toBe(12.63)
  })

  it('should filter orders by storeId when exported by STORE_ADMIN role', () => {
    const allOrders: MockExportOrder[] = [
      {
        id: 'ord-1',
        orderNumber: 'ORD-ROXY-01',
        storeId: 'store-roxy',
        storeName: 'PT Gadget Jaya Sentosa - Roxy Mas Pusat',
        createdAt: '2026-09-22',
        status: 'Selesai',
        commissionAmount: 100000,
        packingFee: 5000,
        discountAmount: 0,
        shippingCost: 20000,
        insuranceFee: 10000,
        items: [
          {
            productName: 'Gadget 1',
            price: 5000000,
            costPrice: 4000000,
            quantity: 1,
          },
        ],
      },
      {
        id: 'ord-2',
        orderNumber: 'ORD-SBY-01',
        storeId: 'store-surabaya',
        storeName: 'PT Sinar Gadget Nusantara - WTC Surabaya',
        createdAt: '2026-09-22',
        status: 'Selesai',
        commissionAmount: 200000,
        packingFee: 5000,
        discountAmount: 0,
        shippingCost: 25000,
        insuranceFee: 15000,
        items: [
          {
            productName: 'Gadget 2',
            price: 10000000,
            costPrice: 8500000,
            quantity: 1,
          },
        ],
      },
    ]

    // Simulate STORE_ADMIN of store-roxy
    const storeAdminId = 'store-roxy'
    const isolatedOrders = allOrders.filter((o) => o.storeId === storeAdminId)

    const result = generateFinancialExportRows(isolatedOrders)
    expect(result.rows).toHaveLength(2) // 1 data row + 1 total row
    expect(result.rows[0][1]).toBe('ORD-ROXY-01')
    expect(result.rows[1][7]).toBe(5000000) // Total gross only for Roxy
  })

  it('should detect currency columns and apply Indonesian Rupiah accounting format ("Rp "#,##0;[Red]("-Rp "#,##0);"Rp 0")', async () => {
    const { getColumnFormatAndAlignment, CURRENCY_FORMAT } =
      await import('@/lib/reports-export-format')

    const omzetConfig = getColumnFormatAndAlignment('Omzet Kotor (Rp)')
    expect(omzetConfig.type).toBe('currency')
    expect(omzetConfig.numFmt).toBe(CURRENCY_FORMAT)
    expect(omzetConfig.alignment.horizontal).toBe('right')

    const hppConfig = getColumnFormatAndAlignment('HPP Modal (Rp)')
    expect(hppConfig.type).toBe('currency')
    expect(hppConfig.numFmt).toBe(CURRENCY_FORMAT)

    const labaBersihConfig = getColumnFormatAndAlignment(
      'Laba Bersih Toko (Rp)'
    )
    expect(labaBersihConfig.type).toBe('currency')
    expect(labaBersihConfig.numFmt).toBe(CURRENCY_FORMAT)

    const ordersTotalConfig = getColumnFormatAndAlignment('Total (Rp)')
    expect(ordersTotalConfig.type).toBe('currency')
    expect(ordersTotalConfig.numFmt).toBe(CURRENCY_FORMAT)
  })

  it('should format percentage and quantity columns appropriately with proper alignment', async () => {
    const { getColumnFormatAndAlignment, PERCENT_FORMAT, QUANTITY_FORMAT } =
      await import('@/lib/reports-export-format')

    const marginConfig = getColumnFormatAndAlignment('Margin Kotor (%)')
    expect(marginConfig.type).toBe('percent')
    expect(marginConfig.numFmt).toBe(PERCENT_FORMAT)
    expect(marginConfig.alignment.horizontal).toBe('right')

    const qtyConfig = getColumnFormatAndAlignment('Qty')
    expect(qtyConfig.type).toBe('quantity')
    expect(qtyConfig.numFmt).toBe(QUANTITY_FORMAT)
    expect(qtyConfig.alignment.horizontal).toBe('right')

    const productConfig = getColumnFormatAndAlignment('Produk')
    expect(productConfig.type).toBe('text')
    expect(productConfig.alignment.horizontal).toBe('left')

    const noConfig = getColumnFormatAndAlignment('No')
    expect(noConfig.type).toBe('center')
    expect(noConfig.alignment.horizontal).toBe('center')
  })
})
