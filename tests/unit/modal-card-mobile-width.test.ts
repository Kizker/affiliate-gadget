import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Modal Card Mobile Width and Spacing Suite', () => {
  const rootDir = process.cwd()

  it('1. verifies DialogContent base component provides clearance on mobile', () => {
    const dialogPath = path.join(
      rootDir,
      'src',
      'components',
      'ui',
      'dialog.tsx'
    )
    const dialogContent = fs.readFileSync(dialogPath, 'utf-8')

    expect(dialogContent).toContain('w-[calc(100%-2.5rem)]')
    expect(dialogContent).toContain('sm:w-full')
  })

  it('2. verifies Admin Orders detail modal uses reduced width on mobile without touching borders', () => {
    const ordersPath = path.join(
      rootDir,
      'src',
      'app',
      'dashboard',
      'admin',
      'orders',
      'page.tsx'
    )
    const ordersContent = fs.readFileSync(ordersPath, 'utf-8')

    expect(ordersContent).toContain('w-[calc(100%-3rem)]')
    expect(ordersContent).toContain('sm:w-full')
    expect(ordersContent).toContain('max-w-3xl')
  })

  it('3. verifies Admin Orders modal applies responsive padding for comfortable mobile layout', () => {
    const ordersPath = path.join(
      rootDir,
      'src',
      'app',
      'dashboard',
      'admin',
      'orders',
      'page.tsx'
    )
    const ordersContent = fs.readFileSync(ordersPath, 'utf-8')

    expect(ordersContent).toContain('px-4.5 py-4 dark:border-slate-800')
    expect(ordersContent).toContain('p-4.5 sm:space-y-6 sm:p-7')
    expect(ordersContent).toContain('px-4.5 py-3.5 dark:border-slate-800')
  })

  it('4. verifies Check Resi modal avoids flush screen borders on mobile', () => {
    const resiPath = path.join(
      rootDir,
      'src',
      'components',
      'shipping',
      'check-resi-modal.tsx'
    )
    const resiContent = fs.readFileSync(resiPath, 'utf-8')

    expect(resiContent).toContain('w-[calc(100%-3rem)]')
    expect(resiContent).toContain('sm:w-full sm:max-w-lg')
    expect(resiContent).not.toContain('w-[95vw]')
  })
})
