import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('AdminFooter Component & Layout Integration', () => {
  const footerPath = path.resolve(
    process.cwd(),
    'src/components/dashboard/admin-footer.tsx'
  )
  const layoutClientPath = path.resolve(
    process.cwd(),
    'src/components/dashboard/admin-layout-client.tsx'
  )

  it('1. should verify admin-footer.tsx exists on disk', () => {
    expect(fs.existsSync(footerPath), 'admin-footer.tsx must exist').toBe(true)
  })

  it('2. should contain the platform copyright branding and styling classes', () => {
    const content = fs.readFileSync(footerPath, 'utf8')
    expect(content).toContain(
      '© 2026 Affiliate Gadget • Platform Toko Resmi Indonesia'
    )
    expect(content).toContain('border-t')
    expect(content).toContain('border-slate-200/60')
    expect(content).toContain('dark:border-slate-800')
    expect(content).toContain('isChatPage')
  })

  it('3. should verify AdminLayoutClient imports and renders AdminFooter', () => {
    const layoutContent = fs.readFileSync(layoutClientPath, 'utf8')
    expect(layoutContent).toContain(
      "import { AdminFooter } from '@/components/dashboard/admin-footer'"
    )
    expect(layoutContent).toContain('<AdminFooter isChatPage={isChatPage} />')
    // Ensure old inline <footer> tag is removed
    expect(layoutContent).not.toMatch(/<footer[\s\S]*?© 2026 Affiliate Gadget/)
  })
})
