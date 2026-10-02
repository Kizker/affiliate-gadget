import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Unified Warranty Claim & Returns Suite (Phase 9)', () => {
  it('unifies sidebar navigation menus to Pengembalian & Klaim Garansi linking to /dashboard/admin/returns', () => {
    const sidebarPath = path.join(
      process.cwd(),
      'src/components/dashboard/sidebar.tsx'
    )
    const content = fs.readFileSync(sidebarPath, 'utf-8')

    // Must have the unified menu label
    expect(content).toContain('Pengembalian & Klaim Garansi')
    expect(content).toContain("href: '/dashboard/admin/returns'")

    // Must NOT have the separate Klaim Garansi menu pointing to /dashboard/admin/complaints in nav items
    expect(content).not.toContain("href: '/dashboard/admin/complaints',")
  })

  it('redirects /dashboard/admin/complaints to /dashboard/admin/returns seamlessly', () => {
    const complaintsPagePath = path.join(
      process.cwd(),
      'src/app/dashboard/admin/complaints/page.tsx'
    )
    const content = fs.readFileSync(complaintsPagePath, 'utf-8')

    expect(content).toContain("router.replace('/dashboard/admin/returns')")
  })

  it('updates admin dashboard quick action link to /dashboard/admin/returns', () => {
    const adminPagePath = path.join(
      process.cwd(),
      'src/app/dashboard/admin/page.tsx'
    )
    const content = fs.readFileSync(adminPagePath, 'utf-8')

    expect(content).toContain("href: '/dashboard/admin/returns'")
    expect(content).toContain("label: 'Pengembalian & Klaim Garansi'")
  })

  it('provides 3 store action presets (Ganti Unit, Kembalikan Duit, Perbaiki Barang) in returns modal', () => {
    const returnsPagePath = path.join(
      process.cwd(),
      'src/app/dashboard/admin/returns/page.tsx'
    )
    const content = fs.readFileSync(returnsPagePath, 'utf-8')

    // Unified Header
    expect(content).toContain('Pengembalian & Klaim Garansi')

    // 3 Store Decision Actions
    expect(content).toContain('Ganti Unit Baru')
    expect(content).toContain('Kembalikan Duit')
    expect(content).toContain('Perbaiki Barang')

    // Functional input form controls
    expect(content).toContain('handleExecuteResolution')
    expect(content).toContain('resolutionAction')
    expect(content).toContain('trackingNumberInput')
    expect(content).toContain('repairStage')
    expect(content).toContain('CheckResiModal')
  })

  it('implements backend functional resolution action for Ganti Unit Baru (reshipping with tracking)', () => {
    const routePath = path.join(
      process.cwd(),
      'src/app/api/returns/[id]/route.ts'
    )
    const content = fs.readFileSync(routePath, 'utf-8')

    // REPLACEMENT workflow updates order back to SHIPPED with tracking number
    expect(content).toContain("resolutionAction === 'REPLACEMENT'")
    expect(content).toContain("status: 'SHIPPED'")
    expect(content).toContain('courierCode:')
    expect(content).toContain('trackingNumber:')
    expect(content).toContain('Unit baru pengganti telah diproses')
  })

  it('implements backend functional resolution action for Kembalikan Duit (Midtrans escrow refund & Iris payout)', () => {
    const routePath = path.join(
      process.cwd(),
      'src/app/api/returns/[id]/route.ts'
    )
    const content = fs.readFileSync(routePath, 'utf-8')

    // REFUND workflow calls Midtrans Core refund / Iris disbursement and updates order to RETURNED & REFUNDED
    expect(content).toContain("resolutionAction === 'REFUND'")
    expect(content).toContain('refundMidtransTransaction')
    expect(content).toContain('createIrisPayout')
    expect(content).toContain("status: 'RETURNED'")
    expect(content).toContain('Refund Midtrans diproses')
    expect(content).toContain('sendOrderRefundedEmail')
  })

  it('implements backend functional resolution action for Perbaiki Barang with 2 distinct stages', () => {
    const routePath = path.join(
      process.cwd(),
      'src/app/api/returns/[id]/route.ts'
    )
    const content = fs.readFileSync(routePath, 'utf-8')

    // Stage 1: IN_REVIEW with [SEDANG_DIPERBAIKI] waiting for repair
    expect(content).toContain("resolutionAction === 'REPAIR_IN_PROGRESS'")
    expect(content).toContain("updateData.status = 'IN_REVIEW'")
    expect(content).toContain('[SEDANG_DIPERBAIKI]')

    // Stage 2: COMPLETED with [PERBAIKAN_SELESAI] and order updated to SHIPPED
    expect(content).toContain("resolutionAction === 'REPAIR_COMPLETED'")
    expect(content).toContain("updateData.status = 'COMPLETED'")
    expect(content).toContain('[PERBAIKAN_SELESAI]')
    expect(content).toContain("status: 'SHIPPED'")
  })

  it('provides CheckResiModal live tracking for replacement & repaired gadget delivery on customer order detail', () => {
    const customerDetailPath = path.join(
      process.cwd(),
      'src/app/dashboard/customer/orders/[orderId]/order-detail-client.tsx'
    )
    const content = fs.readFileSync(customerDetailPath, 'utf-8')

    // Must have CheckResiModal integration
    expect(content).toContain('CheckResiModal')
    expect(content).toContain('Lacak Pengiriman Unit (Live)')
    expect(content).toContain('Tahap 1: Unit Sedang Diperbaiki oleh Teknisi')
    expect(content).toContain('Pengembalian Dana Selesai (Midtrans Escrow)')
  })

  it('automates replacement shipping with Biteship courier booking and auto-generated AWB', () => {
    const routePath = path.join(
      process.cwd(),
      'src/app/api/returns/[id]/route.ts'
    )
    const content = fs.readFileSync(routePath, 'utf-8')

    // Must import and trigger Biteship booking
    expect(content).toContain('bookShippingPickup')
    expect(content).toContain('@/lib/shipping/biteship-client')
    expect(content).toContain('originStore')
    expect(content).toContain('destinationCustomer')
    expect(content).toContain('bookedShippingRecord.trackingNumber')
    expect(content).toContain('booking: bookedShippingRecord')
  })

  it('integrates Biteship courier options and automatic printable ThermalShippingLabel on returns dashboard', () => {
    const returnsPagePath = path.join(
      process.cwd(),
      'src/app/dashboard/admin/returns/page.tsx'
    )
    const content = fs.readFileSync(returnsPagePath, 'utf-8')

    // Must provide Biteship options & ThermalShippingLabel modal
    expect(content).toContain('JNE Express')
    expect(content).toContain('Reguler (Biteship)')
    expect(content).toContain('Gojek Instant')
    expect(content).toContain('Kilat 1-2 Jam (Biteship)')
    expect(content).toContain('ThermalShippingLabel')
    expect(content).toContain('activeThermalLabel')
    expect(content).toContain('Auto Biteship')
    expect(content).toContain('Label Thermal')
  })

  it('immediately displays AWB in success modal and restarts transaction lifecycle from delivery until resolved', () => {
    const returnsPagePath = path.join(
      process.cwd(),
      'src/app/dashboard/admin/returns/page.tsx'
    )
    const pageContent = fs.readFileSync(returnsPagePath, 'utf-8')

    // Must show AWB modal immediately upon dispatch
    expect(pageContent).toContain('awbModalData')
    expect(pageContent).toContain('Nomor Resi Baru (AWB Resmi):')
    expect(pageContent).toContain('BITESHIP_COURIERS')
    expect(pageContent).toContain('renderCourierDropdown')

    const routePath = path.join(
      process.cwd(),
      'src/app/api/returns/[id]/route.ts'
    )
    const routeContent = fs.readFileSync(routePath, 'utf-8')

    // Must reset customer confirmation to restart the transaction delivery cycle
    expect(routeContent).toContain('customerConfirmedAt: null')
    expect(routeContent).toContain('completedAt: null')

    const customerDetailPath = path.join(
      process.cwd(),
      'src/app/dashboard/customer/orders/[orderId]/order-detail-client.tsx'
    )
    const customerContent = fs.readFileSync(customerDetailPath, 'utf-8')

    // Must allow confirmation and re-complaint when delivery restarts
    expect(customerContent).toContain('!hasActiveClaim')
    expect(customerContent).toContain("order.status === 'SHIPPED'")
  })
})
