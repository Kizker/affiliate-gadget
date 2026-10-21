import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Homepage Desktop Visual Refinements (Screenshots 1 - 4)', () => {
  const heroPath = path.join(
    process.cwd(),
    'src/components/landing/section-hero-clean.tsx'
  )
  const trustPillarsPath = path.join(
    process.cwd(),
    'src/components/landing/section-trust-pillars.tsx'
  )
  const featuredGadgetsPath = path.join(
    process.cwd(),
    'src/components/landing/section-featured-gadgets.tsx'
  )
  const storeSpotlightPath = path.join(
    process.cwd(),
    'src/components/landing/section-store-spotlight.tsx'
  )

  it('1. Screenshot 1: should remove red-boxed subtitle paragraph from Hero section', () => {
    const content = fs.readFileSync(heroPath, 'utf-8')

    // Verifikasi paragraf subtitle telah dihapus total
    expect(content).not.toContain(
      'Marketplace smartphone & gadget second original berbasis'
    )
    expect(content).not.toContain('Jaminan unit like new, 100%')
    expect(content).not.toContain(
      'Gadget second teruji teknisi, garansi toko 30 hari'
    )

    // Headline dan tombol CTA tetap utuh
    expect(content).toContain('Beli Gadget Second')
    expect(content).toContain('Lebih Tenang &amp; Terjamin.')
    expect(content).toContain('Jelajahi Gadget Second')
    expect(content).toContain('Lokasi Toko Fisik')
  })

  it('2. Screenshot 2: should remove red-boxed descriptions and shorten cards in Trust Pillars', () => {
    const content = fs.readFileSync(trustPillarsPath, 'utf-8')

    // Verifikasi teks deskripsi yang digaris merahi telah dihapus
    expect(content).not.toContain(
      'Jika unit second mengalami kendala fungsional'
    )
    expect(content).not.toContain(
      'Otomatis siap pakai. Setiap pembelian unit second'
    )
    expect(content).not.toContain(
      'Seluruh cabang toko fisik terdaftar legal di Jakarta'
    )
    expect(content).not.toContain('{item.desc}')

    // Verifikasi card dipendekkan (tidak ada h-screen dan flex-1 stretch)
    expect(content).not.toContain('h-screen flex flex-col')
    expect(content).toContain(
      '<section className="border-y border-slate-100 bg-slate-50/50 py-10 sm:py-14'
    )

    // Verifikasi pilar utama tetap ada
    expect(content).toContain('Garansi 30 Hari Tukar Unit')
    expect(content).toContain('Paket Bonus 3-in-1 (Rp 0)')
    expect(content).toContain('Jaringan Toko Terverifikasi')
  })

  it('3. Screenshot 3: should display top 4 best sellers only and ensure brand filter respects top 4', () => {
    const content = fs.readFileSync(featuredGadgetsPath, 'utf-8')

    // Verifikasi MAX_TOP_PHONES dibatasi ketat ke 4
    expect(content).toContain('const MAX_TOP_PHONES = 4')
    expect(content).toContain('Top 4 HP terlaris bergaransi toko 30 hari')

    // Verifikasi inner scroll dan h-screen ditiadakan
    expect(content).not.toContain('h-screen flex-col overflow-hidden')
    expect(content).not.toContain('overflow-y-auto')

    // Verifikasi logika filtering brand tetap mengurutkan soldCount dan mengambil slice 4
    expect(content).toContain('const phonesOnly = products.filter')
    expect(content).toContain("selectedCategory === 'ALL'")
    expect(content).toContain(
      'const soldDiff = (Number(b.soldCount) || 0) - (Number(a.soldCount) || 0)'
    )
    expect(content).toContain('return sorted.slice(0, MAX_TOP_PHONES)')
  })

  it('4. Screenshot 4: should shorten store cards and remove empty space in Store Spotlight', () => {
    const content = fs.readFileSync(storeSpotlightPath, 'utf-8')

    // Verifikasi h-screen dan peregangan flex-1 ditiadakan
    expect(content).not.toContain('h-screen flex-col overflow-hidden')
    expect(content).not.toContain(
      'flex min-h-0 w-full max-w-7xl flex-1 flex-col'
    )
    expect(content).not.toContain('hidden min-h-0 flex-1 md:grid')
    expect(content).not.toContain('flex flex-1 flex-col p-5')
    expect(content).not.toContain('flex flex-1 items-start gap-1.5')

    // Card menggunakan wrap ringkas
    expect(content).toContain(
      '<section className="border-y border-slate-100 bg-slate-50/50 py-10 sm:py-14'
    )
    expect(content).toContain('<div className="flex flex-col p-5">')
    expect(content).toContain(
      '<div className="flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400">'
    )
    expect(content).toContain('Kunjungi Toko')
  })
})
