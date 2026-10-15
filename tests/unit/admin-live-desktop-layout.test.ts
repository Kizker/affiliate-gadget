import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Admin Live Studio Desktop Layout Suite (Full-Height Chat & Lower Pinned Goods Section)', () => {
  const broadcasterPath = path.join(
    process.cwd(),
    'src/components/live/live-stream-broadcaster.tsx'
  )
  const broadcasterCode = fs.readFileSync(broadcasterPath, 'utf-8')

  it('1. Upper Section: Live Chat occupies full height on the right side next to camera (no vertical splitting with catalog)', () => {
    // Upper section grid with Camera on left (col-span-2) and Chat on right (col-span-1)
    expect(broadcasterCode).toContain('lg:grid lg:h-[calc(100vh-140px)]')
    expect(broadcasterCode).toContain('lg:grid-cols-3')
    expect(broadcasterCode).toContain('lg:col-span-2 lg:h-full')

    // LiveChatPanel container is full height (h-full) on desktop
    expect(broadcasterCode).toContain('lg:col-span-1 lg:h-full')
    expect(broadcasterCode).toContain('<LiveChatPanel')
  })

  it('2. Lower Section: Pinned Goods Catalog is placed underneath camera and live chat section', () => {
    // Pinned goods section is in a dedicated lower container below the upper studio row
    expect(broadcasterCode).toContain(
      'SECTION BAWAH: KATALOG BARANG SEMATAN (Di Bawah Section Camera & Live Chat)'
    )
    expect(broadcasterCode).toContain('Katalog Sematan ({products.length})')
    expect(broadcasterCode).toContain(
      'Pilih dan sematkan gadget ke layar siaran'
    )
  })

  it('3. Pinned Goods Grid: features multi-column responsive grid with spacious discount inputs & pin buttons', () => {
    // Grid layout for catalog products
    expect(broadcasterCode).toContain(
      'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
    )
    // Extra discount input field during pin
    expect(broadcasterCode).toContain(
      'Diskon Ekstra Saat Sematkan / Diskon (Rp):'
    )
    expect(broadcasterCode).toContain('handlePinProduct(p, discountPrice)')
    expect(broadcasterCode).toContain('handleUnpinProduct')
  })

  it('4. Real-time Search & Filter Controls: instant catalog search and initial selection pills', () => {
    expect(broadcasterCode).toContain('Cari semua gadget katalog...')
    expect(broadcasterCode).toContain("setProductFilterMode('all')")
    expect(broadcasterCode).toContain("setProductFilterMode('featured')")
  })
})
