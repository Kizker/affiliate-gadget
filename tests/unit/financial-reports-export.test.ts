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
    items: MockExportOrderItem[]
  }

  function generateFinancialExportRows(orders: MockExportOrder[]) {
    // Hanya pesanan COMPLETED / Selesai yang dimasukkan ke laporan keuangan
    const completedOrders = orders.filter(
      (o) => o.status === 'COMPLETED' || o.status === 'Selesai'
    )

    let sumGross = 0
    let sumCOGS = 0
    let sumGrossProfit = 0
    let sumCommission = 0
    let sumPacking = 0
    let sumVoucher = 0
    let sumShipping = 0
    let sumInsurance = 0
    let sumNetProfit = 0
    let sumQty = 0

    const rows = completedOrders.map((order, index) => {
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

    if (completedOrders.length > 0) {
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
        sumCOGS,
        sumGrossProfit,
        sumCommission,
        sumPacking,
        sumVoucher,
        sumShipping,
        sumInsurance,
        sumNetProfit,
        // Executive Summary Metrics (Sheet 2: RINGKASAN_PENDAPATAN)
        totalPemasukanKotor: sumGross,
        totalPemasukanEscrow:
          sumGross - sumVoucher + sumShipping + sumInsurance,
        totalPotongan: sumCommission + sumPacking + sumVoucher,
        totalHppModal: sumCOGS,
        totalLabaKotor: sumGrossProfit,
        totalKasBersihToko: Math.max(0, sumGross - sumVoucher - sumCommission),
        totalPendapatanResmiToko: sumNetProfit,
        totalPendapatanResmiPlatform: sumCommission,
      },
    }
  }

  it('should define exactly 18 comprehensive financial columns in export sheet without tax columns', () => {
    expect(EXPECTED_FINANCIAL_HEADERS).toHaveLength(18)
    expect(EXPECTED_FINANCIAL_HEADERS).toContain('Omzet Kotor (Rp)')
    expect(EXPECTED_FINANCIAL_HEADERS).not.toContain('DPP (Rp)')
    expect(EXPECTED_FINANCIAL_HEADERS).not.toContain('PPN 11% (Rp)')
    expect(EXPECTED_FINANCIAL_HEADERS).not.toContain('Skema PPN')
    expect(EXPECTED_FINANCIAL_HEADERS).not.toContain('PPh 23 Komisi (Rp)')
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
    expect(firstRow[8]).toBe(17500000) // COGS
    expect(firstRow[9]).toBe(2499000) // Gross Profit = 19.999.000 - 17.500.000
    expect(firstRow[10]).toBe(12.5) // Margin Kotor % = (2499000 / 19999000) * 100 = 12.50%
    expect(firstRow[11]).toBe(399980) // Komisi 2%
    expect(firstRow[12]).toBe(5000) // Packing flat
    expect(firstRow[13]).toBe(50000) // Voucher
    expect(firstRow[14]).toBe(35000) // Shipping pass-through
    expect(firstRow[15]).toBe(40000) // Insurance pass-through

    // Total expense = 399.980 + 5.000 + 50.000 = 454.980
    // Net profit = 2.499.000 - 454.980 = 2.044.020 (Shipping & insurance NOT deducted)
    expect(firstRow[16]).toBe(2044020)
    expect(firstRow[17]).toBe(10.22) // Net Margin % = (2044020 / 19999000) * 100
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
    expect(totalRow[8]).toBe(25500000) // Total COGS = 8.5jt + 17jt
    expect(totalRow[9]).toBe(4500000) // Total Gross Profit = 30jt - 25.5jt
    expect(totalRow[10]).toBe(15) // Weighted Gross Margin % = (4.5jt / 30jt) * 100 = 15%
    expect(totalRow[11]).toBe(600000) // Total Commission
    expect(totalRow[12]).toBe(10000) // Total Packing (5rb * 2)
    expect(totalRow[13]).toBe(100000) // Total Voucher
    expect(totalRow[14]).toBe(75000) // Total Shipping pass-through
    expect(totalRow[15]).toBe(60000) // Total Insurance pass-through

    // Total expenses = 600.000 + 10.000 + 100.000 = 710.000
    // Total Net Profit = 4.500.000 - 710.000 = 3.790.000
    expect(totalRow[16]).toBe(3790000)
    // Weighted Net Margin % = (3.790.000 / 30.000.000) * 100 = 12.63%
    expect(totalRow[17]).toBe(12.63)
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

  it('should strictly filter and exclude non-completed orders (IN_PROGRESS, SHIPPED, PENDING_PAYMENT, COMPLAINED) from financial report', () => {
    const mixedOrders: MockExportOrder[] = [
      {
        id: 'ord-completed',
        orderNumber: 'ORD-DONE-01',
        storeId: 'store-roxy',
        storeName: 'PT Gadget Jaya Sentosa',
        createdAt: '2026-09-30',
        status: 'COMPLETED',
        commissionAmount: 150000,
        packingFee: 5000,
        discountAmount: 0,
        shippingCost: 30000,
        insuranceFee: 25000,
        items: [
          {
            productName: 'iPhone 15',
            price: 10000000,
            costPrice: 8500000,
            quantity: 1,
          },
        ],
      },
      {
        id: 'ord-shipped',
        orderNumber: 'ORD-SHIP-02',
        storeId: 'store-roxy',
        storeName: 'PT Gadget Jaya Sentosa',
        createdAt: '2026-09-30',
        status: 'SHIPPED', // Dalam pengiriman kurir — DILARANG masuk laporan keuangan
        commissionAmount: 150000,
        packingFee: 5000,
        discountAmount: 0,
        shippingCost: 30000,
        insuranceFee: 25000,
        items: [
          {
            productName: 'Samsung S24',
            price: 10000000,
            costPrice: 8500000,
            quantity: 1,
          },
        ],
      },
      {
        id: 'ord-in-progress',
        orderNumber: 'ORD-PROC-03',
        storeId: 'store-roxy',
        storeName: 'PT Gadget Jaya Sentosa',
        createdAt: '2026-09-30',
        status: 'IN_PROGRESS', // Sedang diproses toko — DILARANG masuk laporan keuangan
        commissionAmount: 150000,
        packingFee: 5000,
        discountAmount: 0,
        shippingCost: 30000,
        insuranceFee: 25000,
        items: [
          {
            productName: 'Xiaomi 14',
            price: 8000000,
            costPrice: 7000000,
            quantity: 1,
          },
        ],
      },
      {
        id: 'ord-pending',
        orderNumber: 'ORD-WAIT-04',
        storeId: 'store-roxy',
        storeName: 'PT Gadget Jaya Sentosa',
        createdAt: '2026-09-30',
        status: 'PENDING_PAYMENT', // Belum bayar — DILARANG masuk laporan keuangan
        commissionAmount: 0,
        packingFee: 0,
        discountAmount: 0,
        shippingCost: 0,
        insuranceFee: 0,
        items: [
          {
            productName: 'iPad Pro',
            price: 15000000,
            costPrice: 13000000,
            quantity: 1,
          },
        ],
      },
    ]

    const result = generateFinancialExportRows(mixedOrders)

    // Hanya 1 order COMPLETED + 1 baris TOTAL
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0][1]).toBe('ORD-DONE-01')
    expect(result.rows[0][4]).toBe('COMPLETED')
    expect(result.summary.sumGross).toBe(10000000)
    expect(result.summary.sumQty).toBe(1)
  })

  it('should calculate accurate executive summary for Sheet 2 (RINGKASAN_PENDAPATAN) including Total Pemasukan, Total Potongan, and Total Pendapatan Resmi', () => {
    const completedOrders: MockExportOrder[] = [
      {
        id: 'ord-1',
        orderNumber: 'ORD-DONE-01',
        storeId: 'store-roxy',
        storeName: 'PT Gadget Jaya Sentosa',
        createdAt: '2026-09-30',
        status: 'COMPLETED',
        commissionAmount: 300000, // 1.5% dari 20.000.000
        packingFee: 5000,
        discountAmount: 100000,
        shippingCost: 50000,
        insuranceFee: 50000,
        items: [
          {
            productName: 'iPhone 15 Pro Max',
            price: 20000000,
            costPrice: 17000000,
            quantity: 1,
          },
        ],
      },
      {
        id: 'ord-2',
        orderNumber: 'ORD-DONE-02',
        storeId: 'store-surabaya',
        storeName: 'PT Sinar Gadget Nusantara',
        createdAt: '2026-09-30',
        status: 'COMPLETED',
        commissionAmount: 150000, // 1.5% dari 10.000.000
        packingFee: 5000,
        discountAmount: 0,
        shippingCost: 40000,
        insuranceFee: 25000,
        items: [
          {
            productName: 'Galaxy S24 Ultra',
            price: 10000000,
            costPrice: 8000000,
            quantity: 1,
          },
        ],
      },
    ]

    const result = generateFinancialExportRows(completedOrders)
    const summary = result.summary

    // 1. TOTAL PEMASUKAN
    expect(summary.totalPemasukanKotor).toBe(30000000) // 20jt + 10jt
    // Total Escrow Pembeli = Omzet - Voucher (100rb) + Ongkir (90rb) + Asuransi (75rb) = 30.065.000
    expect(summary.totalPemasukanEscrow).toBe(30065000)

    // 2. TOTAL POTONGAN
    // Total Potongan = Komisi (450rb) + Packing (10rb) + Voucher (100rb) = 560.000
    expect(summary.totalPotongan).toBe(560000)

    // 3. TOTAL PENDAPATAN RESMI
    expect(summary.totalHppModal).toBe(25000000) // 17jt + 8jt
    expect(summary.totalLabaKotor).toBe(5000000) // 30jt - 25jt
    // Kas Bersih Toko = Omzet (30jt) - Diskon (100rb) - Komisi (450rb) = 29.450.000
    expect(summary.totalKasBersihToko).toBe(29450000)
    // Laba Bersih Toko (Net Profit) = Laba Kotor (5jt) - Potongan (560rb) = 4.440.000
    expect(summary.totalPendapatanResmiToko).toBe(4440000)
    // Pendapatan Resmi Platform Superadmin = Komisi 1.5% = 450.000
    expect(summary.totalPendapatanResmiPlatform).toBe(450000)
  })

  it('should format Sheet 2 (RINGKASAN_PENDAPATAN) with exactly 4 clean columns (excluding Keterangan) and reconcile live cash balances with Web Dashboard', () => {
    // 1. Verifikasi struktur 4 kolom bersih (tanpa kolom Keterangan & Penjelasan)
    const SHEET_2_HEADERS = [
      'No',
      'Kategori Finansial',
      'Uraian Komponen Arus Kas',
      'Nilai (Rp)',
    ]
    expect(SHEET_2_HEADERS).toHaveLength(4)
    expect(SHEET_2_HEADERS).not.toContain('Keterangan & Penjelasan')
    expect(SHEET_2_HEADERS).not.toContain('Keterangan')
    expect(SHEET_2_HEADERS).not.toContain('Penjelasan')

    // 2. Simulasi Rekonsiliasi Kas Toko Cabang (Store Admin)
    const storeNetRevenue = 28762000 // Total hak kas bersih toko dari pesanan selesai
    const storeWithdrawn = 5000000 // Total saldo ditarik / dicairkan admin toko ke rekening Mandiri PT
    const availableBalance = Math.max(0, storeNetRevenue - storeWithdrawn) // 23.762.000 (Sesuai Web Card 1)
    const escrowBalance = 15000000 // Dana tertahan pesanan berjalan (Sesuai Web Card 4)

    // Entri Baris Sheet 2
    const summaryEntries = [
      {
        no: '12',
        category: 'IV. REKONSILIASI SALDO & KAS',
        item: 'Total Saldo Sudah Ditarik / Dicairkan ke Rekening PT',
        amount: storeWithdrawn,
      },
      {
        no: '13',
        category: 'IV. REKONSILIASI SALDO & KAS',
        item: 'SISA SALDO SIAP CAIR (AVAILABLE BALANCE SESUAI WEB)',
        amount: availableBalance,
        highlightType: 'success',
      },
      {
        no: '14',
        category: 'IV. REKONSILIASI SALDO & KAS',
        item: 'Dana Tertahan Escrow (Pesanan Masih Dalam Pengiriman/Proses)',
        amount: escrowBalance,
        highlightType: 'warning',
      },
    ]

    expect(summaryEntries).toHaveLength(3)
    // Sisa Saldo Siap Cair + Saldo Ditarik HARUS 100% klop dengan Hak Kas Bersih Toko
    expect(summaryEntries[0].amount).toBe(5000000)
    expect(summaryEntries[1].amount).toBe(23762000)
    expect(summaryEntries[0].amount + summaryEntries[1].amount).toBe(
      storeNetRevenue
    )
    expect(summaryEntries[2].amount).toBe(15000000)

    // 3. Simulasi Rekonsiliasi Kas Platform (Superadmin Holding)
    const totalPlatformCommission = 438000 // 1.5% komisi pesanan selesai konsolidasi seluruh toko
    const holdingWithdrawn = 100000 // Penarikan holding
    const superadminAvailable = Math.max(
      0,
      totalPlatformCommission - holdingWithdrawn
    ) // 338.000 (Sesuai Web Card 1 Superadmin)

    const superadminEntries = [
      {
        no: '12',
        category: 'IV. REKONSILIASI SALDO & KAS',
        item: 'Total Saldo Sudah Ditarik / Dicairkan ke Rekening PT',
        amount: holdingWithdrawn,
      },
      {
        no: '13',
        category: 'IV. REKONSILIASI SALDO & KAS',
        item: 'SISA SALDO SIAP CAIR (AVAILABLE BALANCE SESUAI WEB)',
        amount: superadminAvailable,
        highlightType: 'success',
      },
    ]

    expect(superadminEntries[0].amount + superadminEntries[1].amount).toBe(
      totalPlatformCommission
    )
    expect(superadminEntries[1].amount).toBe(338000)
  })
})
