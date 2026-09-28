import { describe, it, expect } from 'vitest'
import {
  generateWaybill,
  bookShippingPickup,
  getShippingBooking,
  getDynamicTrackingTimeline,
} from '@/lib/shipping/biteship-client'

describe('Automated Shipping Pickup & Tracking Timeline Gates', () => {
  it('generates valid Waybill only upon booking pickup, never beforehand', () => {
    const unbooked = getShippingBooking('order-not-yet-picked-up-123')
    expect(unbooked).toBeNull()

    const jneAwb = generateWaybill('JNE')
    expect(jneAwb).toMatch(/^JNE\d+$/)

    const gojekAwb = generateWaybill('GOJEK')
    expect(gojekAwb).toMatch(/^GK-\d+$/)
  })

  it('activates Biteship shipping only after Request Pick Up is called', async () => {
    const orderId = `test-pickup-${Date.now()}`
    const mockOrder = {
      orderId,
      orderNumber: `SPR-TEST-${Date.now().toString().slice(-6)}`,
      courierCode: 'GOJEK' as const,
      courierService: 'INSTANT',
      originStore: {
        name: 'Roxy Mas Pusat',
        companyName: 'PT Gadget Jaya Sentosa',
        address: 'ITC Roxy Mas Lt. 2 No. 15',
        city: 'Jakarta Pusat',
        phone: '081234567890',
      },
      destinationCustomer: {
        name: 'Rian Pratama',
        address: 'Pt Evergreen Jakarta',
        city: 'Jakarta Selatan',
        province: 'DKI Jakarta',
        phone: '087827323427',
      },
      items: [
        {
          name: 'iPhone 15 Pro Max 8GB/512GB Black Titanium',
          quantity: 1,
          weightGram: 500,
          price: 26999000,
        },
      ],
    }

    // Before pickup: no record in storage
    expect(getShippingBooking(orderId)).toBeNull()

    // Store admin clicks "Request Pick Up"
    const booking = await bookShippingPickup(mockOrder)

    // After pickup: record created with official AWB and driver
    expect(booking.orderId).toBe(orderId)
    expect(booking.trackingNumber).toMatch(/^GK-\d+$/)
    expect(booking.status).toBe('ALLOCATED')
    expect(booking.driver?.name).toBeDefined()
    expect(booking.checkpoints.length).toBeGreaterThanOrEqual(1)

    // Retrieved from store successfully
    const stored = getShippingBooking(orderId)
    expect(stored).not.toBeNull()
    expect(stored?.trackingNumber).toBe(booking.trackingNumber)
  })

  it('calculates dynamic timeline progression starting strictly from bookedAt time', () => {
    const nowIso = new Date().toISOString()
    const freshRecord = {
      orderId: 'fresh-pickup-order',
      orderNumber: 'SPR-FRESH-001',
      courierCode: 'GOJEK' as const,
      courierService: 'INSTANT',
      trackingNumber: 'GK-260928999999',
      status: 'ALLOCATED' as const,
      statusLabel: 'Driver Menuju Lokasi Toko',
      driver: {
        name: 'Budi Santoso',
        phone: '0812-8841-9023',
        plateNumber: 'B 4821 KZZ',
        vehicleModel: 'Honda Vario 160 Hitam',
      },
      checkpoints: [
        {
          id: 'cp-1',
          status: 'DRIVER_ALLOCATED',
          description: 'Driver berhasil dialokasikan',
          location: 'Roxy Mas',
          timestamp: nowIso,
        },
      ],
      bookedAt: nowIso, // just booked right now
      originStore: {
        name: 'Roxy Mas',
        companyName: 'PT Gadget Jaya Sentosa',
        address: 'ITC Roxy Mas',
        city: 'Jakarta',
        phone: '081234567890',
      },
      destinationCustomer: {
        name: 'Customer',
        address: 'Alamat',
        city: 'Jakarta',
        province: 'DKI Jakarta',
        phone: '081234567890',
      },
      items: [{ name: 'Gadget', quantity: 1, weightGram: 500 }],
    }

    // Immediately after booking (0 minutes elapsed):
    // Should NOT be delivered yet!
    const timeline = getDynamicTrackingTimeline(freshRecord)
    expect(timeline.status).toBe('ALLOCATED')
    expect(timeline.checkpoints).toHaveLength(1)
    expect(timeline.checkpoints.some((c) => c.status === 'DELIVERED')).toBe(
      false
    )
  })
})
