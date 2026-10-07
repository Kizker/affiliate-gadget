import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Navbar Burger Menu Removal Verification Suite', () => {
  const navbarFilePath = path.join(
    process.cwd(),
    'src/components/layouts/navbar.tsx'
  )
  const navbarContent = fs.readFileSync(navbarFilePath, 'utf-8')

  it('verifies that Navbar no longer imports Menu, X, or ArrowRight for mobile drawer', () => {
    const lucideImportMatch = navbarContent.match(/from\s+['"]lucide-react['"]/)
    expect(lucideImportMatch).toBeTruthy()

    // Ambil baris import lucide-react
    const importBlock = navbarContent.substring(
      navbarContent.indexOf('import {'),
      navbarContent.indexOf("} from 'lucide-react'") + 21
    )
    expect(importBlock).not.toContain('Menu')
    expect(importBlock).not.toContain('X')
    expect(importBlock).not.toContain('ArrowRight')
  })

  it('verifies that mobileMenuOpen state and toggles are completely removed', () => {
    expect(navbarContent).not.toContain('mobileMenuOpen')
    expect(navbarContent).not.toContain('setMobileMenuOpen')
    expect(navbarContent).not.toContain('aria-label="Toggle Menu"')
  })

  it('verifies that mobile drawer container is removed from Navbar', () => {
    expect(navbarContent).not.toContain('Mobile Navigation Drawer')
    expect(navbarContent).not.toContain('Auth Banner for Mobile Guests')
  })

  it('verifies that desktop navigation and mobile action icons remain intact', () => {
    // Desktop navigation links must still exist
    expect(navbarContent).toContain('navLinks.map')
    // Chat icon must remain
    expect(navbarContent).toContain('aria-label="Pesan Live Chat"')
    // Cart icon must remain
    expect(navbarContent).toContain('aria-label="Keranjang Belanja"')
    // User account action must remain
    expect(navbarContent).toContain('aria-label="Masuk Akun"')
  })
})
