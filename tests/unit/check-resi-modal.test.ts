import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('CheckResiModal (In-Page Resi & AWB Tracking Modal)', () => {
  const modalPath = path.resolve(
    process.cwd(),
    'src/components/shipping/check-resi-modal.tsx'
  )
  const ordersPagePath = path.resolve(
    process.cwd(),
    'src/app/dashboard/admin/orders/page.tsx'
  )

  const modalContent = fs.readFileSync(modalPath, 'utf8')
  const ordersPageContent = fs.readFileSync(ordersPagePath, 'utf8')

  it('1. should define CheckResiModal component with Dialog and awb-lookup integration', () => {
    expect(modalContent).toContain('export function CheckResiModal')
    expect(modalContent).toContain('/api/shipping/tracking/awb-lookup?awb=')
    expect(modalContent).toContain('Dialog')
    expect(modalContent).toContain('DialogContent')
    expect(modalContent).toContain('DialogTitle')
  })

  it('2. should support initialQuery, copy AWB, and reverse checkpoints timeline', () => {
    expect(modalContent).toContain('initialQuery')
    expect(modalContent).toContain('navigator.clipboard.writeText')
    expect(modalContent).toContain('[...data.checkpoints].reverse()')
    expect(modalContent).toContain('STATUS_ICON')
  })

  it('3. should provide a search form with input and submit button in modal', () => {
    expect(modalContent).toContain('form')
    expect(modalContent).toContain('handleSearchSubmit')
    expect(modalContent).toContain(
      'Masukkan No. Resi (AWB) atau No. Pesanan...'
    )
  })

  it('4. should render Cek Resi button as modal trigger in orders page without navigating away', () => {
    expect(ordersPageContent).not.toMatch(
      /<Link[^>]*href="\/resi"[^>]*>\s*Cek Resi\s*<\/Link>/
    )
    expect(ordersPageContent).toContain('setShowCheckResiModal(true)')
    expect(ordersPageContent).toContain('<CheckResiModal')
    expect(ordersPageContent).toContain('isOpen={showCheckResiModal}')
  })

  it('5. should allow clicking order tracking number in table to inspect in modal directly', () => {
    expect(ordersPageContent).toContain(
      "setCheckResiQuery(order.trackingNumber || '')"
    )
  })
})
