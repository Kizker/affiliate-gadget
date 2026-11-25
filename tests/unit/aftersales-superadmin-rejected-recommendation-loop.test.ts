import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('After Sales & Superadmin Return Recommendation & Loop Rejection Suite', () => {
  it('1. PUT /api/returns/[id] hanya meng-ACC tolak final jika Superadmin setuju (isApprove === true), dan jika tidak setuju dikembalikan ke After Sales', () => {
    const routePath = path.join(
      process.cwd(),
      'src/app/api/returns/[id]/route.ts'
    )
    const content = fs.readFileSync(routePath, 'utf-8')

    // Harus memeriksa isApprove sebelum tolak final
    expect(content).toContain(
      'if (isSuperAdmin && isApprove && isAfterSalesRecommendingReject)'
    )
    // Jika Superadmin menolak usulan After Sales, kembalikan ke After Sales
    expect(content).toContain('if (')
    expect(content).toContain('(isSuperAdmin && !isApprove)')
    expect(content).toContain("status: 'IN_REVIEW'")
    expect(content).toContain('resolvedAt: null')
    expect(content).toContain('[Dikembalikan Superadmin ke After Sales]')
  })

  it('2. GET /api/returns memastikan tiket yang dikembalikan Superadmin berstatus IN_REVIEW', () => {
    const routePath = path.join(process.cwd(), 'src/app/api/returns/route.ts')
    const content = fs.readFileSync(routePath, 'utf-8')

    expect(content).toContain('isReturnedToAfterSales')
    expect(content).toContain(
      "effectiveStatus = isReturnedToAfterSales ? 'IN_REVIEW' : r.status"
    )
  })

  it('3. After Sales page menampilkan opsi Setujui Permintaan dan Tolak Permintaan kembali saat tiket dikembalikan Superadmin', () => {
    const afterSalesPagePath = path.join(
      process.cwd(),
      'src/app/dashboard/after-sales/returns/page.tsx'
    )
    const content = fs.readFileSync(afterSalesPagePath, 'utf-8')

    expect(content).toContain('[Dikembalikan Superadmin ke After Sales]')
    expect(content).toContain('Setujui Permintaan')
    expect(content).toContain('Tolak Permintaan')
    expect(content).toContain('Dikembalikan Superadmin (Revisi)')
  })

  it('4. Superadmin page menyediakan tombol untuk mengembalikan tiket yang ditolak ke After Sales untuk ditinjau ulang', () => {
    const adminPagePath = path.join(
      process.cwd(),
      'src/app/dashboard/admin/returns/page.tsx'
    )
    const content = fs.readFileSync(adminPagePath, 'utf-8')

    expect(content).toContain('Kembalikan ke After Sales (Tinjau Ulang)')
  })
})
