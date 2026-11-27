import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Commission Mutation Custom Dropdown Suite', () => {
  const mutationsViewPath = path.join(
    process.cwd(),
    'src/components/admin/finance/views/mutations-view.tsx'
  )

  it('differentiates dropdown content for COMMISSION vs SALE categories', () => {
    const content = fs.readFileSync(mutationsViewPath, 'utf-8')

    // 1. Pengecekan kategori COMMISSION khusus
    expect(content).toContain("tx.category === 'COMMISSION' && b ? (")

    // 2. Konten khusus Komisi: Dana Awal, Persen Potongan, Hasil Potongan Minus
    expect(content).toContain('Rincian Potongan Komisi Platform')
    expect(content).toContain('Dana Awal (Subtotal Pesanan)')
    expect(content).toContain('Dipotong Persen Komisi')
    expect(content).toContain('Hasil Potongan Komisi')
    expect(content).toContain(
      '- {formatRupiah(tx.amount || b.commissionAmount)}'
    )

    // 3. Pengecekan kategori GATEWAY khusus (simple minus payment gateway)
    expect(content).toContain("tx.category === 'GATEWAY' ? (")
    expect(content).toContain('Rincian Biaya Payment Gateway')
    expect(content).toContain('Biaya Payment Gateway (Midtrans)')
    expect(content).toContain('- {formatRupiah(tx.amount || 4000)}')

    // 4. Kategori selain komisi & gateway (Penjualan Gadget dll) tetap mempertahankan rincian lengkap unit dan modal
    expect(content).toContain('Rincian Unit Produk & Varian')
    expect(content).toContain('Komponen Penjualan & Modal')
  })
})
