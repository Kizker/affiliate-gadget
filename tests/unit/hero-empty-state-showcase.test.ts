import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Hero Clean Showcase Empty State Handling', () => {
  const heroCleanPath = path.join(
    process.cwd(),
    'src/components/landing/section-hero-clean.tsx'
  )

  it('1. should not have dummy items in DEFAULT_SHOWCASE_ITEMS', () => {
    const content = fs.readFileSync(heroCleanPath, 'utf-8')
    expect(content).toContain(
      'const DEFAULT_SHOWCASE_ITEMS: ShowcaseItem[] = []'
    )
    expect(content).not.toContain("name: 'Galaxy S24 Ultra 5G'")
    expect(content).not.toContain("name: 'iPhone 15 Pro & Pro Max'")
    expect(content).not.toContain("name: 'Xiaomi 14 Ultra Leica'")
  })

  it('2. should only render 3D carousel right column when showcaseItems.length > 0', () => {
    const content = fs.readFileSync(heroCleanPath, 'utf-8')
    expect(content).toContain('showcaseItems.length > 0 && (')
  })

  it('3. should return empty array in buildBestsellers and buildPromos when top3 is empty', () => {
    const content = fs.readFileSync(heroCleanPath, 'utf-8')
    expect(content).toContain('if (top3.length === 0) return []')
  })
})
