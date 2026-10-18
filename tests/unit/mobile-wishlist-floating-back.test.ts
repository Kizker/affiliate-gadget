import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

describe('Mobile Wishlist Subview Floating Back Button & Header Elimination', () => {
  const mobileCustomerAccountPath = path.resolve(
    process.cwd(),
    'src/components/customer/mobile-customer-account-view.tsx'
  )

  it('memvalidasi tombol kembali melayang tanpa teks untuk subview wishlist', () => {
    const content = fs.readFileSync(mobileCustomerAccountPath, 'utf-8')

    // Kondisi khusus activeSubView === 'wishlist'
    expect(content).toContain("activeSubView === 'wishlist' ? (")

    // Tombol kembali melayang di kiri atas dengan icon saja
    expect(content).toContain(
      'fixed left-3.5 top-3.5 z-50 flex h-9 w-9 items-center justify-center rounded-full'
    )
    expect(content).toContain('<ArrowLeft className="h-4 w-4" />')

    // Header div hanya dirender pada else branch ketika bukan wishlist
    expect(content).toContain(') : (')
    expect(content).toContain(
      '<header className="z-50 flex shrink-0 items-center justify-between border-b'
    )

    // Tombol floating wishlist tidak merender elemen teks apapun
    const floatingButtonMatch = content.match(
      /activeSubView === 'wishlist'\s*\?\s*\(\s*<button[\s\S]*?<\/button>\s*\)/
    )
    expect(floatingButtonMatch).not.toBeNull()
    if (floatingButtonMatch) {
      expect(floatingButtonMatch[0]).not.toContain('<span>')
      expect(floatingButtonMatch[0]).not.toContain('Wishlist Saya')
      expect(floatingButtonMatch[0]).toContain('<ArrowLeft')
    }
  })

  it('memvalidasi penyesuaian margin top untuk kartu wishlist agar tidak tertutup tombol melayang', () => {
    const content = fs.readFileSync(mobileCustomerAccountPath, 'utf-8')
    expect(content).toContain("activeSubView === 'wishlist' ? 'mt-12' : ''")
  })
})
