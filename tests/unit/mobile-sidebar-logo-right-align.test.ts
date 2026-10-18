import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Mobile Sidebar Brand Logo Alignment Suite', () => {
  const rootDir = process.cwd()
  const sidebarPath = path.join(
    rootDir,
    'src',
    'components',
    'dashboard',
    'sidebar.tsx'
  )
  const sidebarContent = fs.readFileSync(sidebarPath, 'utf-8')

  it('1. verifies mobile menu toggle button has fixed left-4 top-4 z-50 positioning', () => {
    expect(sidebarContent).toContain('fixed left-4 top-4 z-50')
    expect(sidebarContent).toContain('onClick={toggleMobile}')
    expect(sidebarContent).toContain('<X className="h-5 w-5" />')
  })

  it('2. verifies brand header gives clearance on left and right-aligns logo on mobile', () => {
    expect(sidebarContent).toContain(
      'justify-end pl-16 pr-4 lg:justify-between lg:px-4'
    )
    expect(sidebarContent).toContain('ml-auto')
    expect(sidebarContent).toContain('lg:ml-0')
  })

  it('3. verifies desktop layout preserves left logo and right collapse button', () => {
    expect(sidebarContent).toContain('PanelLeftClose')
    expect(sidebarContent).toContain('lg:flex')
    expect(sidebarContent).toContain('lg:justify-between')
    expect(sidebarContent).toContain('lg:px-4')
  })

  it('4. verifies mobile logo click triggers closeMobile to auto-close drawer', () => {
    expect(sidebarContent).toContain('onClick={closeMobile}')
    expect(sidebarContent).toContain('alt="Affiliate Gadget Logo"')
  })
})
