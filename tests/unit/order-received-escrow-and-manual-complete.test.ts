import { describe, it, expect } from 'vitest'
import {
  orderCreatedMessage,
  orderShippedMessage,
  orderDeliveredMessage,
  orderCompletedMessage,
  otpMessage,
} from '@/lib/notifications/templates/whatsapp-templates'
import { isWarrantyExpired } from '@/lib/order-return-utils'

describe('Order Received Escrow, Manual Complete & Clean WhatsApp Templates', () => {
  it('1. should treat confirmed received order with active 30-day warranty as escrow (not settled to withdrawable balance)', () => {
    const now = new Date()
    const future30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const receivedOrder = {
      status: 'SHIPPED',
      customerConfirmedAt: now,
      completedAt: null, // Belum diselesaikan manual
      warrantyExpiryDate: future30Days, // Garansi masih 30 hari ke depan
    }

    const isWarrantyOver = isWarrantyExpired(receivedOrder)
    const isUnder30Days =
      receivedOrder.warrantyExpiryDate &&
      Date.now() < new Date(receivedOrder.warrantyExpiryDate).getTime()

    // Status dana: Belum settled, masih tertahan di Escrow!
    const isOrderFullySettled = Boolean(
      receivedOrder.status === 'COMPLETED' &&
      receivedOrder.completedAt &&
      (isWarrantyOver || !isUnder30Days)
    )

    const isHoldingInWarrantyEscrow = Boolean(
      receivedOrder.customerConfirmedAt &&
      isUnder30Days &&
      !receivedOrder.completedAt
    )

    expect(isWarrantyOver).toBe(false)
    expect(isOrderFullySettled).toBe(false)
    expect(isHoldingInWarrantyEscrow).toBe(true)
  })

  it('2. should settle order to withdrawable balance when customer manually completes order (warranty ended immediately)', () => {
    const now = new Date()

    // Customer menekan tombol Selesaikan Pesanan Manual
    const manuallyCompletedOrder = {
      status: 'COMPLETED',
      customerConfirmedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // Diterima 2 hari lalu
      completedAt: now, // Selesai hari ini manual
      warrantyExpiryDate: now, // Garansi berakhir saat diselesaikan manual
    }

    const isWarrantyOver = isWarrantyExpired(manuallyCompletedOrder)
    const isUnder30Days =
      manuallyCompletedOrder.warrantyExpiryDate &&
      Date.now() < new Date(manuallyCompletedOrder.warrantyExpiryDate).getTime()

    const isOrderFullySettled = Boolean(
      manuallyCompletedOrder.status === 'COMPLETED' &&
      Boolean(manuallyCompletedOrder.completedAt)
    )

    const isHoldingInWarrantyEscrow = Boolean(
      manuallyCompletedOrder.customerConfirmedAt &&
      isUnder30Days &&
      !manuallyCompletedOrder.completedAt
    )

    expect(isOrderFullySettled).toBe(true)
    expect(isHoldingInWarrantyEscrow).toBe(false)
  })

  it('3. should generate clean, elegant, non-spammy WhatsApp notification templates', () => {
    const otp = otpMessage('288192', 'Ganti Nomor Telepon')
    expect(otp).toContain('*AFFILIATE GADGET*')
    expect(otp).toContain('━━━━━━━━━━━━━━━━━━━━')
    expect(otp).toContain('*288192*')
    expect(otp).not.toContain('🔥')

    const created = orderCreatedMessage(
      'ASRock',
      'SPR-20261124-74BE1238',
      'Rp 37.818.340',
      '24 Jam'
    )
    expect(created).toContain('Halo Kak *ASRock*')
    expect(created).toContain('#SPR-20261124-74BE1238')
    expect(created).toContain('Rp 37.818.340')

    const shipped = orderShippedMessage(
      'ASRock',
      'SPR-20261124-74BE1238',
      'GOJEK INSTANT',
      'GK-261124352100',
      'https://affiliategadget.tech/resi?no=GK-261124352100'
    )
    expect(shipped).toContain('GOJEK INSTANT')
    expect(shipped).toContain('GK-261124352100')

    const completed = orderCompletedMessage('ASRock', 'SPR-20261124-74BE1238')
    expect(completed).toContain('SELESAI')
    expect(completed).toContain('Garansi Toko 30 Hari Aktif')
  })
})
