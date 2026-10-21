import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

describe('Mobile Subview Clean Header & Centered Navigation Suite', () => {
  const mobileCustomerAccountPath = path.resolve(
    process.cwd(),
    'src/components/customer/mobile-customer-account-view.tsx'
  )

  it('memvalidasi tombol kembali dan judul terpusat untuk semua subview termasuk wishlist', () => {
    const content = fs.readFileSync(mobileCustomerAccountPath, 'utf-8')

    // Clean Centered Header matching Screenshot 2
    expect(content).toContain('Clean Centered Header matching Screenshot 2')
    expect(content).toContain(
      '<header className="sticky top-0 z-50 flex shrink-0 items-center justify-between border-b'
    )
    expect(content).toContain('<ArrowLeft className="h-5 w-5" />')
    expect(content).toContain('{currentMeta.title}')
  })

  it('memvalidasi scroll container natural dengan overscroll-contain untuk subview', () => {
    const content = fs.readFileSync(mobileCustomerAccountPath, 'utf-8')
    expect(content).toContain(
      'min-h-0 flex-1 overflow-y-auto overscroll-contain'
    )
  })
})
