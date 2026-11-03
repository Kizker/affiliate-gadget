import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { validateAWB } from '@/lib/shipping/awb-validator'

describe('Pelacakan Biteship Real-Time Pengiriman Balik Retur (Customer, After Sales & Superadmin)', () => {
  const awbLookupRoutePath = path.resolve(
    'src/app/api/shipping/tracking/awb-lookup/route.ts'
  )
  const desktopCardPath = path.resolve(
    'src/components/customer/order-detail/order-desktop-return-card.tsx'
  )
  const mobileViewPath = path.resolve(
    'src/components/customer/order-detail/order-mobile-view.tsx'
  )
  const afterSalesPagePath = path.resolve(
    'src/app/dashboard/after-sales/returns/page.tsx'
  )
  const superAdminPagePath = path.resolve(
    'src/app/dashboard/admin/returns/page.tsx'
  )

  it('1. Validator Resi: Mendukung nomor resi numerik (10-20 digit) serta prefix kurir standar', () => {
    // Numerik resi (seperti format resi kurir standard ekspedisi)
    const validNumeric = validateAWB('1793637840069')
    expect(validNumeric.valid).toBe(true)
    expect(validNumeric.courierCode).toBe('JNE')

    // Prefix AGY
    const validAGY = validateAWB('AGY-1793637840069')
    expect(validAGY.valid).toBe(true)
    expect(validAGY.courierCode).toBe('JNE')

    // Prefix GK
    const validGK = validateAWB('GK-1793637840069')
    expect(validGK.valid).toBe(true)
    expect(validGK.courierCode).toBe('GOJEK')
  })

  it('2. Backend awb-lookup: Mendukung pencarian resi pengiriman balik returnRequest dengan checkpoints live', () => {
    const routeCode = fs
      .readFileSync(awbLookupRoutePath, 'utf8')
      .replace(/\r\n/g, '\n')

    expect(routeCode).toContain('prisma.returnRequest.findFirst')
    expect(routeCode).toContain(
      "returnTrackingNumber: { equals: cleanInput, mode: 'insensitive' }"
    )
    expect(routeCode).toContain('(Pengirim Retur)')
    expect(routeCode).toContain('(Penerima Retur)')
    expect(routeCode).toContain('CP-RET-1')
    expect(routeCode).toContain('CP-RET-2')
  })

  it('3. UI Customer Desktop: Menyediakan tombol "Lacak Resi (Biteship)" saat barang retur sedang dikirim balik', () => {
    const code = fs.readFileSync(desktopCardPath, 'utf8').replace(/\r\n/g, '\n')

    expect(code).toContain('latestReturnRequest.returnTrackingNumber')
    expect(code).toContain('Lacak Resi (Biteship)')
    expect(code).toContain('onOpenResiModal')
  })

  it('4. UI Customer Mobile: Menyediakan tombol "Lacak Kiriman Retur" saat barang retur sedang dikirim balik', () => {
    const code = fs.readFileSync(mobileViewPath, 'utf8').replace(/\r\n/g, '\n')

    expect(code).toContain('latestReturnRequest.returnTrackingNumber')
    expect(code).toContain('Lacak Kiriman Retur')
    expect(code).toContain('onOpenResiModal')
  })

  it('5. Meja Kerja After Sales: Mengintegrasikan CheckResiModal dan tombol "Lacak Biteship" pada resi pembeli', () => {
    const code = fs
      .readFileSync(afterSalesPagePath, 'utf8')
      .replace(/\r\n/g, '\n')

    expect(code).toContain(
      "import { CheckResiModal } from '@/components/shipping/check-resi-modal'"
    )
    expect(code).toContain('item.returnTrackingNumber')
    expect(code).toContain('Lacak Biteship')
    expect(code).toContain('CheckResiModal')
    expect(code).toContain('initialQuery={activeTrackingQuery}')
  })

  it('6. Meja Kerja Superadmin: Menampilkan banner resi kirim balik dan tombol "Lacak Biteship" terintegrasi', () => {
    const code = fs
      .readFileSync(superAdminPagePath, 'utf8')
      .replace(/\r\n/g, '\n')

    expect(code).toContain(
      "import { CheckResiModal } from '@/components/shipping/check-resi-modal'"
    )
    expect(code).toContain('item.returnTrackingNumber')
    expect(code).toContain('Unit Retur Sedang Dikirim Balik oleh Pembeli')
    expect(code).toContain('Lacak Biteship')
    expect(code).toContain('CheckResiModal')
    expect(code).toContain('initialQuery={activeTrackingQuery}')
  })
})
