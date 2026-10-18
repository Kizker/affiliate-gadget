import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

describe('Mobile Catalog Masonry Dynamic Height & White Gap Elimination', () => {
  const mobileCatalogViewPath = path.resolve(
    process.cwd(),
    'src/components/gadget/mobile-catalog-view.tsx'
  )

  it('memvalidasi eliminasi aspect-square pada kontainer gambar produk agar tinggi mengikuti gambar', () => {
    const content = fs.readFileSync(mobileCatalogViewPath, 'utf-8')

    // Kontainer gambar tidak boleh dipaksa aspect-square (yang menciptakan gap putih jika foto bukan 1:1)
    expect(content).not.toMatch(
      /Natural Aspect Ratio Image Box[\s\S]*?aspect-square/
    )

    // Kontainer gambar menggunakan relative w-full tanpa batasan aspect-ratio buatan
    expect(content).toContain(
      'relative w-full max-w-full overflow-hidden rounded-xl'
    )

    // Gambar menggunakan block h-auto w-full max-w-full object-cover
    expect(content).toContain(
      'block h-auto w-full max-w-full object-cover transition-transform duration-300 hover:scale-105'
    )
  })

  it('memvalidasi struktur grid 2-kolom waterfall masonry', () => {
    const content = fs.readFileSync(mobileCatalogViewPath, 'utf-8')

    // 2-column masonry grid items-start
    expect(content).toContain('grid grid-cols-2 items-start gap-2.5')
    expect(content).toContain('leftColumnItems')
    expect(content).toContain('rightColumnItems')
  })
})
