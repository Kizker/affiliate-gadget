import { describe, it, expect } from 'vitest'

describe('Order Receipt Confirmation & Top Notification Flow', () => {
  it('should determine eligible order statuses for customer receipt confirmation', () => {
    const isEligibleForConfirmation = (order: {
      status: string
      customerConfirmedAt?: string | null
    }) => {
      if (order.customerConfirmedAt) return false
      if (order.status === 'CANCELLED' || order.status === 'PENDING_PAYMENT')
        return false
      return ['SHIPPED', 'COMPLETED', 'IN_PROGRESS', 'PROCESSING'].includes(
        order.status
      )
    }

    expect(
      isEligibleForConfirmation({
        status: 'SHIPPED',
        customerConfirmedAt: null,
      })
    ).toBe(true)
    expect(
      isEligibleForConfirmation({
        status: 'PROCESSING',
        customerConfirmedAt: null,
      })
    ).toBe(true)
    expect(
      isEligibleForConfirmation({
        status: 'COMPLETED',
        customerConfirmedAt: null,
      })
    ).toBe(true)
    expect(
      isEligibleForConfirmation({
        status: 'COMPLETED',
        customerConfirmedAt: '2026-09-23T10:00:00Z',
      })
    ).toBe(false)
    expect(
      isEligibleForConfirmation({
        status: 'CANCELLED',
        customerConfirmedAt: null,
      })
    ).toBe(false)
    expect(
      isEligibleForConfirmation({
        status: 'PENDING_PAYMENT',
        customerConfirmedAt: null,
      })
    ).toBe(false)
  })

  it('should compute 30-day warranty window on confirmation', () => {
    const confirmOrderAndComputeWarranty = (confirmedAt: Date) => {
      const warrantyExpiry = new Date(
        confirmedAt.getTime() + 30 * 24 * 60 * 60 * 1000
      )
      const diffDays = Math.round(
        (warrantyExpiry.getTime() - confirmedAt.getTime()) /
          (1000 * 60 * 60 * 24)
      )
      return {
        warrantyExpiry,
        diffDays,
      }
    }

    const testTime = new Date('2026-09-23T14:00:00Z')
    const { warrantyExpiry, diffDays } =
      confirmOrderAndComputeWarranty(testTime)

    expect(diffDays).toBe(30)
    expect(warrantyExpiry.toISOString()).toBe('2026-10-23T14:00:00.000Z')
  })

  it('should format sleek top notification confirmation prompt text accurately', () => {
    const getTopNotificationContent = () => {
      return {
        title: 'Konfirmasi Pesanan Diterima?',
        description:
          'Pastikan fisik gadget sesuai. Garansi 30 hari ganti baru akan langsung aktif.',
        cancelLabel: 'Batal',
        confirmLabel: 'Ya, Diterima',
        successToast: 'Pesanan selesai & garansi 30 hari resmi aktif!',
      }
    }

    const content = getTopNotificationContent()
    expect(content.title).toBe('Konfirmasi Pesanan Diterima?')
    expect(content.description).toContain('Garansi 30 hari')
    expect(content.cancelLabel).toBe('Batal')
    expect(content.confirmLabel).toBe('Ya, Diterima')
    expect(content.successToast).toContain('garansi 30 hari')
  })
})
