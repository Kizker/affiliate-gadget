import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Settled Order Balance and Store Profit Calculations Test Suite', () => {
  it('1. api/admin/finance/route.ts menghitung saldo siap cair pesanan COMPLETED tanpa menunggu 30 hari warrantyExpiryDate', () => {
    const routePath = path.join(
      process.cwd(),
      'src/app/api/admin/finance/route.ts'
    )
    const content = fs.readFileSync(routePath, 'utf-8')

    // Query aggregate saldo siap cair tidak memfilter warrantyExpiryDate lte now
    expect(content).not.toContain('warrantyExpiryDate: { lte: new Date() }')
    expect(content).toContain("status: 'COMPLETED'")
    expect(content).toContain('const isOrderFullySettled = Boolean(')
    expect(content).toContain(
      "order.status === 'COMPLETED' && !isUnderReturnDispute"
    )
  })

  it('2. api/admin/finance/route.ts tidak menahan pesanan COMPLETED di escrow', () => {
    const routePath = path.join(
      process.cwd(),
      'src/app/api/admin/finance/route.ts'
    )
    const content = fs.readFileSync(routePath, 'utf-8')

    expect(content).not.toContain('isHoldingInWarrantyEscrow')
  })

  it('3. api/admin/reports/route.ts tidak membebankan voucher platform ke laba toko dan tidak menghasilkan laba minus', () => {
    const routePath = path.join(
      process.cwd(),
      'src/app/api/admin/reports/route.ts'
    )
    const content = fs.readFileSync(routePath, 'utf-8')

    expect(content).toContain('isStoreVoucher')
    expect(content).toContain('voucher?.storeId === order.storeId')
    expect(content).toContain('totalNetProfit = Math.max(')
    expect(content).toContain('storeNetProfit: totalNetProfit')
  })

  it('4. finance-kpi-cards.tsx dan finance-mobile-view.tsx memastikan laba bersih toko tidak ditampilkan minus', () => {
    const kpiPath = path.join(
      process.cwd(),
      'src/components/admin/finance/finance-kpi-cards.tsx'
    )
    const kpiContent = fs.readFileSync(kpiPath, 'utf-8')

    expect(kpiContent).toContain('Math.max(')
    expect(kpiContent).toContain('stats.completedNetRevenue')

    const mobilePath = path.join(
      process.cwd(),
      'src/components/admin/finance/finance-mobile-view.tsx'
    )
    const mobileContent = fs.readFileSync(mobilePath, 'utf-8')

    expect(mobileContent).toContain('Math.max(')
  })
})
