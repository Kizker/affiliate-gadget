import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Cek Resi Auto-Fill & Auto-Track Suite', () => {
  const resiPagePath = path.join(process.cwd(), 'src/app/resi/page.tsx')

  it('reads tracking number from search params and auto-searches immediately', () => {
    const content = fs.readFileSync(resiPagePath, 'utf-8')

    // 1. Membaca query params: no, awb, resi, order
    expect(content).toContain("searchParams?.get('no')")
    expect(content).toContain("searchParams?.get('awb')")
    expect(content).toContain("searchParams?.get('resi')")
    expect(content).toContain("searchParams?.get('order')")

    // 2. Memanggil handleSearch secara otomatis
    expect(content).toContain('handleSearch(initialAwb)')

    // 3. Dibungkus Suspense boundary Next.js
    expect(content).toContain('<Suspense')
    expect(content).toContain('<CekResiContent />')
  })

  it('removes unnecessary subtitle and footer description as requested', () => {
    const content = fs.readFileSync(resiPagePath, 'utf-8')

    // Subtitle deskripsi di bawah judul telah dihapus
    expect(content).not.toContain(
      'Masukkan nomor resi atau nomor pesanan Anda untuk melacak posisi paket secara real-time'
    )

    // Info footer di bagian paling bawah telah dihapus
    expect(content).not.toContain(
      'Terintegrasi langsung armada JNE & Gojek · Asuransi pengiriman 100% terlindungi'
    )
  })
})
