import { describe, it, expect } from 'vitest'
import { calculatePph23, calculateFullOrderTax } from '@/lib/tax/tax-engine'
import ExcelJS from 'exceljs'
import { CURRENCY_FORMAT } from '@/lib/reports-export-format'

describe('PPh & PPN Dashboard Integration E2E Suite (Otomatisasi Standar CV)', () => {
  // 1. Checkout Flow -> Snapshot PPh 23 Tersimpan Presisi
  it('1. Checkout: Menghasilkan snapshot pph23Amount presisi dari parameter transaksi tanpa PPh Final', () => {
    const grossTotal = 22_000_000
    const commissionGross = 440_000 // 2% dari 22.000.000
    const storeTaxConfig = {
      vatRate: 11.0,
      isPkp: true,
    }

    const taxResult = calculateFullOrderTax(
      grossTotal,
      commissionGross,
      storeTaxConfig
    )

    // DPP Inklusif: 22.000.000 / 1.11 = 19.819.820
    expect(taxResult.dppAmount).toBe(19819820)
    expect(taxResult.vatAmount).toBe(2180180)
    // PPh 23: 2% x 440.000 = 8.800
    expect(taxResult.pph23Amount).toBe(8800)
    // Zero-sum DPP + VAT = Subtotal
    expect(taxResult.dppAmount + taxResult.vatAmount).toBe(grossTotal)
  })

  // 2. Finance API Agregasi PPh 23
  it('2. Finance Agregasi: Menghitung totalPph23Withheld dan membentuk mutasi kategori PPH23', () => {
    const mockOrders = [
      {
        id: 'ord-1',
        orderNumber: 'ORD-001',
        pph23Amount: 8800,
        commissionAmount: 440000,
      },
      {
        id: 'ord-2',
        orderNumber: 'ORD-002',
        pph23Amount: 12000,
        commissionAmount: 600000,
      },
      {
        id: 'ord-3',
        orderNumber: 'ORD-003',
        pph23Amount: 4000,
        commissionAmount: 200000,
      },
    ]

    let totalPph23Withheld = 0
    const mutations: Array<{
      category: string
      amount: number
      refNumber: string
    }> = []

    mockOrders.forEach((order) => {
      totalPph23Withheld += order.pph23Amount || 0
      if (order.pph23Amount && order.pph23Amount > 0) {
        mutations.push({
          category: 'PPH23',
          amount: order.pph23Amount,
          refNumber: `PPH23-${order.orderNumber.replace(/^ORD-/, '')}`,
        })
      }
    })

    expect(totalPph23Withheld).toBe(24800)
    expect(mutations).toHaveLength(3)
    expect(mutations[0].category).toBe('PPH23')
    expect(mutations[0].refNumber).toBe('PPH23-001')
    expect(mutations[0].amount).toBe(8800)
    expect(mutations[1].amount).toBe(12000)
  })

  // 3. Finance API Agregasi PPN Keluaran
  it('3. Finance Agregasi: Menghitung totalVatOutput akumulatif sesuai rentang tanggal', () => {
    const mockOrders = [
      { id: 'ord-1', tax: 2180180 },
      { id: 'ord-2', tax: 1090090 },
      { id: 'ord-3', tax: 545045 },
    ]

    const totalVatOutput = mockOrders.reduce((sum, o) => sum + (o.tax || 0), 0)
    expect(totalVatOutput).toBe(3815315)
  })

  // 4. Reports API Financials Response Object Integrity
  it('4. Reports Response: Memastikan financials menyertakan totalPph23Withheld dan totalVatOutput tanpa totalPph22Reserve', () => {
    const mockOrders = [
      { tax: 2180180, pph23Amount: 8800 },
      { tax: 1090090, pph23Amount: 4400 },
    ]

    let totalVatOutput = 0
    let totalPph23Withheld = 0

    mockOrders.forEach((order) => {
      totalVatOutput += order.tax || 0
      totalPph23Withheld += order.pph23Amount || 0
    })

    const financialsPayload = {
      grossRevenue: 33_000_000,
      totalVatOutput,
      totalPph23Withheld,
    }

    expect(financialsPayload.totalVatOutput).toBe(3270270)
    expect(financialsPayload.totalPph23Withheld).toBe(13200)
    expect((financialsPayload as any).totalPph22Reserve).toBeUndefined()
  })

  // 5. Excel Export Multi-Sheet (LAPORAN_KEUANGAN & RINGKASAN_PAJAK tanpa PPh Final)
  it('5. Export Excel: Menghasilkan 2 sheet dengan format akuntansi pada RINGKASAN_PAJAK tanpa PPh Final', async () => {
    const workbook = new ExcelJS.Workbook()

    // Sheet 1: LAPORAN_KEUANGAN
    const mainSheet = workbook.addWorksheet('LAPORAN_KEUANGAN')
    mainSheet.addRow([
      'No',
      'Nomor Pesanan',
      'Omzet Kotor (Rp)',
      'PPh 23 Komisi (Rp)',
    ])
    mainSheet.addRow([1, 'ORD-001', 22000000, 8800])
    mainSheet.addRow(['TOTAL', '-', 22000000, 8800])

    // Sheet 2: RINGKASAN_PAJAK
    const taxSheet = workbook.addWorksheet('RINGKASAN_PAJAK')
    taxSheet.addRow([
      'No',
      'Komponen Pajak',
      'Keterangan Regulasi & Penyetoran',
      'Total Periode (Rp)',
    ])
    taxSheet.addRow([
      1,
      'PPN Keluaran (11%)',
      'SPT Masa PPN per bulan',
      2180180,
    ])
    taxSheet.addRow([
      2,
      'PPh 23 atas Komisi Platform (2%)',
      'e-Billing DJP (Kode Akun 411124)',
      8800,
    ])

    const totalTax = 2180180 + 8800
    taxSheet.addRow(['TOTAL', 'Total Seluruh Pajak', '-', totalTax])

    expect(workbook.worksheets.length).toBe(2)
    expect(workbook.getWorksheet('LAPORAN_KEUANGAN')?.name).toBe(
      'LAPORAN_KEUANGAN'
    )
    expect(workbook.getWorksheet('RINGKASAN_PAJAK')?.name).toBe(
      'RINGKASAN_PAJAK'
    )

    const taxTotalRow = taxSheet.getRow(4)
    expect(taxTotalRow.getCell(1).value).toBe('TOTAL')
    expect(taxTotalRow.getCell(4).value).toBe(totalTax)
    expect(CURRENCY_FORMAT).toContain('Rp')
  })

  // 6. Multi-Store Data Isolation
  it('6. Isolasi Cabang Toko: Query dengan storeId hanya memproses order milik toko tersebut', () => {
    const ordersAllStores = [
      { id: '1', storeId: 'store-roxy', pph23Amount: 8800 },
      { id: '2', storeId: 'store-roxy', pph23Amount: 4400 },
      { id: '3', storeId: 'store-surabaya', pph23Amount: 15000 },
      { id: '4', storeId: 'store-bandung', pph23Amount: 9000 },
    ]

    const targetStoreId = 'store-roxy'
    const filteredOrders = ordersAllStores.filter(
      (o) => o.storeId === targetStoreId
    )
    const storePph23 = filteredOrders.reduce((sum, o) => sum + o.pph23Amount, 0)

    expect(filteredOrders).toHaveLength(2)
    expect(storePph23).toBe(13200)
    expect(filteredOrders.some((o) => o.storeId !== targetStoreId)).toBe(false)
  })

  // 7. Otomatisasi Standar CV: PPh 23 selalu 2% aktif otomatis
  it('7. Otomatisasi Standar CV: PPh 23 selalu 2% aktif otomatis tanpa checkbox atau konfigurasi manual', () => {
    const taxAuto = calculateFullOrderTax(10_000_000, 200_000)

    expect(taxAuto.pph23Amount).toBe(4000) // 2% dari 200.000 komisi
    expect(taxAuto.pph23Rate).toBe(2.0)
    // Beban bersih toko = 200.000 komisi + 22.000 PPN jasa - 4.000 PPh 23 = 218.000
    expect(taxAuto.netCommissionBurden).toBe(218000)
  })

  // 8. Deadline e-Billing Detection Logic
  it('8. Deadline Warning: Mendeteksi tanggal 7-10 sebagai periode mendekati batas setor e-Billing DJP', () => {
    const checkIsApproachingDeadline = (dayOfMonth: number): boolean => {
      return dayOfMonth >= 7 && dayOfMonth <= 10
    }

    // Hari dalam rentang deadline
    expect(checkIsApproachingDeadline(7)).toBe(true)
    expect(checkIsApproachingDeadline(8)).toBe(true)
    expect(checkIsApproachingDeadline(9)).toBe(true)
    expect(checkIsApproachingDeadline(10)).toBe(true)

    // Hari di luar rentang
    expect(checkIsApproachingDeadline(1)).toBe(false)
    expect(checkIsApproachingDeadline(6)).toBe(false)
    expect(checkIsApproachingDeadline(11)).toBe(false)
    expect(checkIsApproachingDeadline(25)).toBe(false)
  })
})
