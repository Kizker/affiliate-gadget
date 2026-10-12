import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Mobile Orders Simplified UI Suite (Screenshot 2 Match)', () => {
  const mobileOrdersPath = path.resolve(
    process.cwd(),
    'src/components/customer/mobile-orders-view.tsx'
  )
  const content = fs.readFileSync(mobileOrdersPath, 'utf-8')

  it('1. Header kartu toko menampilkan nama toko dengan ChevronRight tanpa ikon Store dan status berupa pill badge', () => {
    // Nama toko dan chevron
    expect(content).toContain("{order.store?.name || 'Cabang Resmi Toko'}")
    expect(content).toContain('ChevronRight')
    // Tidak ada ikon Store
    expect(content).not.toContain('<Store ')

    // Status pill badge helper
    expect(content).toContain('getStatusBadgeClass')
    expect(content).toContain('rounded-lg px-2.5 py-1 text-xs font-semibold')
  })

  it('2. Baris produk bersih dengan Varian dan jumlah barang (1 barang x1) tanpa chip/pill berlebihan', () => {
    // Varian
    expect(content).toContain('Varian: {firstItem?.variantName')
    // Jumlah barang di kiri dan quantity di kanan
    expect(content).toContain('{totalItemCount} barang')
    expect(content).toContain('x{firstItem?.quantity || 1}')

    // Tidak ada pill kurir atau garansi yang membuat kartu padat
    expect(content).not.toContain('<Truck ')
    expect(content).not.toContain('<ShieldCheck ')
  })

  it('3. Baris bawah menggabungkan tanggal dan nomor pesanan, total harga tebal, serta tombol aksi pill rounded-full', () => {
    // Tanggal dan order number
    expect(content).toContain('#{order.orderNumber}')
    expect(content).toContain('{contextualTime.shortDate}')

    // Tombol Chat dan Rincian menggunakan rounded-full
    expect(content).toContain('rounded-full border border-slate-200 bg-white')
    expect(content).toMatch(/Chat\s*<\/Link>/)
    expect(content).toContain(
      'rounded-full border border-slate-900 bg-slate-900'
    )
    expect(content).toMatch(/Rincian\s*<\/Link>/)
  })

  it('4. Status badge mengembalikan class soft pill sesuai status pesanan', () => {
    expect(content).toContain("case 'PAID':")
    expect(content).toContain("case 'CANCELLED':")
    expect(content).toContain("return 'bg-blue-50 text-blue-600")
    expect(content).toContain("return 'bg-slate-100 text-slate-500")
  })
})
