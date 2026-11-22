import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Dual-Tier After Sales to Superadmin Approval Flow Suite', () => {
  const afterSalesReturnsPagePath = path.resolve(
    'src/app/dashboard/after-sales/returns/page.tsx'
  )
  const superAdminReturnsPagePath = path.resolve(
    'src/app/dashboard/admin/returns/page.tsx'
  )
  const returnsIdApiPath = path.resolve('src/app/api/returns/[id]/route.ts')

  it('1. After Sales SELALU mengirim action: AFTER_SALES_CONFIRM (tidak pernah langsung eksekusi ke customer)', () => {
    const content = fs.readFileSync(afterSalesReturnsPagePath, 'utf-8')
    expect(content).toContain("action: 'AFTER_SALES_CONFIRM'")
    expect(content).toContain(
      'Rekomendasi persetujuan berhasil diteruskan ke Superadmin'
    )
    expect(content).toContain('Menunggu ACC Final')
  })

  it('2. PUT /api/returns/[id] memproses AFTER_SALES_CONFIRM dan mengubah status ke IN_REVIEW untuk Superadmin', () => {
    const content = fs.readFileSync(returnsIdApiPath, 'utf-8')
    expect(content).toContain("body.action === 'AFTER_SALES_CONFIRM'")
    expect(content).toContain("status: 'IN_REVIEW'")
    expect(content).toContain('[Rekomendasi After Sales: DISETUJUI]')
    expect(content).toContain('[Rekomendasi After Sales: DITOLAK]')
  })

  it('3. Superadmin adalah eksekutor final (ACC Final): memotong stok & kirim unit pengganti atau cairkan refund', () => {
    const apiContent = fs.readFileSync(returnsIdApiPath, 'utf-8')
    const superPageContent = fs.readFileSync(superAdminReturnsPagePath, 'utf-8')

    expect(superPageContent).toContain('handleDirectApprove')
    expect(superPageContent).toContain('handleDirectRejectAndReturn')

    expect(apiContent).toContain('isSuperAdmin &&')
    expect(apiContent).toContain("resolutionType === 'REPLACEMENT'")
    expect(apiContent).toContain('data: { stock: { decrement: requiredQty } }')
  })

  it('4. Jika Superadmin menolak keputusan After Sales, tiket dikembalikan ke After Sales untuk ditinjau ulang', () => {
    const apiContent = fs.readFileSync(returnsIdApiPath, 'utf-8')
    const afterSalesPageContent = fs.readFileSync(
      afterSalesReturnsPagePath,
      'utf-8'
    )

    expect(apiContent).toContain('[Dikembalikan Superadmin ke After Sales]')
    expect(afterSalesPageContent).toContain(
      '[Dikembalikan Superadmin ke After Sales]'
    )
    expect(afterSalesPageContent).toContain('Keputusan Ditolak oleh Superadmin')
  })
})
