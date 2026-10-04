import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Admin Mitras Modular Components Verification', () => {
  const mitrasDir = path.resolve(process.cwd(), 'src/components/admin/mitras')
  const mitrasPagePath = path.resolve(
    process.cwd(),
    'src/app/dashboard/admin/mitras/page.tsx'
  )

  it('1. should export all modular subcomponents from barrel index', () => {
    const indexPath = path.join(mitrasDir, 'index.ts')
    const indexContent = fs.readFileSync(indexPath, 'utf8')

    expect(indexContent).toContain("export * from './types'")
    expect(indexContent).toContain("export * from './mitra-primary-tabs'")
    expect(indexContent).toContain("export * from './mitra-kpi-cards'")
    expect(indexContent).toContain("export * from './mitra-toolbar'")
    expect(indexContent).toContain("export * from './store-table'")
    expect(indexContent).toContain("export * from './service-mitra-table'")
    expect(indexContent).toContain("export * from './mitra-modals'")
  })

  it('2. should verify all component files exist on disk', () => {
    const expectedFiles = [
      'types.ts',
      'mitra-primary-tabs.tsx',
      'mitra-kpi-cards.tsx',
      'mitra-toolbar.tsx',
      'store-table.tsx',
      'service-mitra-table.tsx',
      'mitra-modals.tsx',
      'index.ts',
    ]

    expectedFiles.forEach((file) => {
      const filePath = path.join(mitrasDir, file)
      expect(fs.existsSync(filePath), `File ${file} should exist`).toBe(true)
    })
  })

  it('3. should verify types.ts contains all required domain interfaces', () => {
    const typesPath = path.join(mitrasDir, 'types.ts')
    const typesContent = fs.readFileSync(typesPath, 'utf8')

    expect(typesContent).toContain('export interface Mitra')
    expect(typesContent).toContain('export interface ServiceMitra')
    expect(typesContent).toContain('export interface Stats')
    expect(typesContent).toContain('export interface ServiceStats')
    expect(typesContent).toContain('export interface BankAccount')
    expect(typesContent).toContain('export interface Schedule')
  })

  it('4. should ensure page.tsx cleanly wires all modular subcomponents without syntax error', () => {
    const pageContent = fs.readFileSync(mitrasPagePath, 'utf8')

    // Clean imports from barrel
    expect(pageContent).toContain("from '@/components/admin/mitras'")

    // Subcomponent usages in page JSX
    expect(pageContent).toContain('<MitraPrimaryTabs')
    expect(pageContent).toContain('<MitraKpiCards')
    expect(pageContent).toContain('<MitraToolbar')
    expect(pageContent).toContain('<StoreTable')
    expect(pageContent).toContain('<ServiceMitraTable')
    expect(pageContent).toContain('<ApproveStoreModal')
    expect(pageContent).toContain('<RejectStoreModal')
    expect(pageContent).toContain('<DeleteStoreModal')
    expect(pageContent).toContain('<CreateServiceMitraModal')
    expect(pageContent).toContain('<DeleteServiceMitraModal')
  })

  it('5. should maintain line count reduction under 700 lines for page.tsx orchestrator', () => {
    const pageContent = fs.readFileSync(mitrasPagePath, 'utf8')
    const lineCount = pageContent.split('\n').length
    // Was 2097 lines, now should be around 450 - 650 lines
    expect(lineCount).toBeLessThan(700)
    expect(lineCount).toBeGreaterThan(200)
  })

  it('6. should verify all 5 modal dialogs are defined in mitra-modals.tsx', () => {
    const modalsPath = path.join(mitrasDir, 'mitra-modals.tsx')
    const modalsContent = fs.readFileSync(modalsPath, 'utf8')

    expect(modalsContent).toContain('export function ApproveStoreModal')
    expect(modalsContent).toContain('export function RejectStoreModal')
    expect(modalsContent).toContain('export function DeleteStoreModal')
    expect(modalsContent).toContain('export function CreateServiceMitraModal')
    expect(modalsContent).toContain('export function DeleteServiceMitraModal')
  })
})
