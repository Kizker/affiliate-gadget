import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Hero Clean Showcase Badges & Promo Lightning Elimination', () => {
  const heroCleanPath = path.join(
    process.cwd(),
    'src/components/landing/section-hero-clean.tsx'
  )

  it('1. should eliminate bestseller ranking badges (#1 Terlaris, #2 Terlaris, #3 Terlaris)', () => {
    const content = fs.readFileSync(heroCleanPath, 'utf-8')

    // Verifikasi badge keterangan ranking terlaris telah dihilangkan dari data
    expect(content).not.toContain("badge: '#1 Terlaris'")
    expect(content).not.toContain("badge: '#2 Terlaris'")
    expect(content).not.toContain("badge: '#3 Terlaris'")
    expect(content).not.toContain('badge: `#${rank} Terlaris`')

    // Verifikasi badge tidak lagi merender bestseller
    expect(content).not.toContain("item.badgeType === 'bestseller'")
  })

  it('2. should eliminate lightning icon and emoji from promo cards', () => {
    const content = fs.readFileSync(heroCleanPath, 'utf-8')

    // Verifikasi tidak ada icon petir Lucide (Zap) maupun emoji petir
    expect(content).not.toContain('<Zap')
    expect(content).not.toContain('⚡')
    expect(content).not.toMatch(/from\s+['"]lucide-react['"].*Zap/)

    // Verifikasi promo badge hanya merender label promo tanpa icon petir
    expect(content).toContain("item.badgeType === 'promo' && item.badge")
    expect(content).toContain('<span>{item.badge}</span>')
  })
})
