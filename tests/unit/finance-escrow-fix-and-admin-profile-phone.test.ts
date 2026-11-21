import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Finance Escrow Leakage Fix, Admin Profile Phone Constraint, & Product Batch Action Bright Bar', () => {
  const financeApiPath = path.resolve('src/app/api/admin/finance/route.ts')
  const profileApiPath = path.resolve('src/app/api/admin/profile/route.ts')
  const productsPagePath = path.resolve(
    'src/app/dashboard/admin/products/page.tsx'
  )

  it('1. Finance API memprioritaskan order.status === RETURNED dan mengecualikan dari escrowBalance', () => {
    const content = fs.readFileSync(financeApiPath, 'utf-8')
    // isUnderReturnDispute hanya true untuk status sengketa aktif dan bukan RETURNED
    expect(content).toContain("order.status !== 'RETURNED'")
    expect(content).toContain(
      "['PENDING', 'IN_REVIEW', 'APPROVED'].includes(activeReturn.status)"
    )

    // order.status === RETURNED dievaluasi sebelum blok escrow
    const returnedIdx = content.indexOf("if (order.status === 'RETURNED')")
    const escrowIdx = content.indexOf('ESCROW_STATUSES.includes(')
    expect(returnedIdx).toBeGreaterThan(-1)
    expect(escrowIdx).toBeGreaterThan(-1)
    expect(returnedIdx).toBeLessThan(escrowIdx)
  })

  it('2. Admin profile PATCH mensanitasi nomor telepon dan menangani P2002 unique constraint agar update tidak crash', () => {
    const content = fs.readFileSync(profileApiPath, 'utf-8')
    expect(content).toContain('sanitizedPhone')
    expect(content).toContain("userErr?.code === 'P2002'")
    expect(content).toContain('delete updateData.phone')
  })

  it('3. Katalog Gadget sticky bar menggunakan bright theme dan aksi batch Aktifkan/Nonaktifkan/Hapus tanpa input harga massal', () => {
    const content = fs.readFileSync(productsPagePath, 'utf-8')
    // Background bright (bg-white/95)
    expect(content).toContain('bg-white/95')
    // Aksi batch yang tersedia
    expect(content).toContain('handleBatchSetActive(true)')
    expect(content).toContain('handleBatchSetActive(false)')
    expect(content).toContain('handleBatchDelete')
    // Tidak ada lagi input harga baru borongan di sticky bottom bar
    expect(content).not.toContain('placeholder="Harga baru (Rp)"')
  })
})
