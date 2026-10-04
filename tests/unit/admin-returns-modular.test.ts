import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import {
  formatDate,
  formatPrice,
  statusConfig,
  BITESHIP_COURIERS,
} from '@/components/admin/returns/types'

describe('Admin Returns Modular Subcomponents & Architecture', () => {
  it('correctly formats price in IDR rupiah format', () => {
    expect(formatPrice(0)).toBe('Rp 0')
    expect(formatPrice(1500000)).toBe('Rp 1.500.000')
    expect(formatPrice(null)).toBe('Rp 0')
    expect(formatPrice(undefined)).toBe('Rp 0')
    expect(formatPrice(NaN)).toBe('Rp 0')
  })

  it('correctly formats valid date string and returns original on invalid', () => {
    const formatted = formatDate('2026-10-04T12:00:00.000Z')
    expect(formatted).toBeTruthy()
    expect(typeof formatted).toBe('string')
    expect(formatDate('invalid-date')).toBe('invalid-date')
  })

  it('provides all 5 lifecycle statuses with badges and dot styling', () => {
    const requiredStatuses = [
      'PENDING',
      'IN_REVIEW',
      'APPROVED',
      'COMPLETED',
      'REJECTED',
    ]

    for (const status of requiredStatuses) {
      expect(statusConfig[status]).toBeDefined()
      expect(statusConfig[status].label).toBeTruthy()
      expect(statusConfig[status].badgeClass).toBeTruthy()
      expect(statusConfig[status].dotClass).toBeTruthy()
    }
  })

  it('configures Biteship supported couriers correctly', () => {
    expect(BITESHIP_COURIERS).toHaveLength(3)
    const courierIds = BITESHIP_COURIERS.map((c) => c.id)
    expect(courierIds).toContain('JNE')
    expect(courierIds).toContain('JNE_YES')
    expect(courierIds).toContain('GOJEK')
  })

  it('verifies dramatic reduction in returns/page.tsx line count through modular refactoring', () => {
    const pagePath = path.join(
      process.cwd(),
      'src/app/dashboard/admin/returns/page.tsx'
    )
    const content = fs.readFileSync(pagePath, 'utf-8')
    const lines = content.split('\n').length

    // Original was 2,209 lines. Modular orchestrator should be under 600 lines (~75% reduction).
    expect(lines).toBeLessThan(600)
  })

  it('verifies all modular subcomponent files exist in src/components/admin/returns', () => {
    const baseDir = path.join(process.cwd(), 'src/components/admin/returns')
    const requiredFiles = [
      'types.ts',
      'returns-header-and-metrics.tsx',
      'returns-toolbar.tsx',
      'return-card.tsx',
      'modals/resolution-action-modal.tsx',
      'modals/media-lightbox-modal.tsx',
      'modals/awb-success-modal.tsx',
      'index.ts',
    ]

    for (const file of requiredFiles) {
      const fullPath = path.join(baseDir, file)
      expect(fs.existsSync(fullPath)).toBe(true)
    }
  })
})
