import { describe, it, expect, beforeEach } from 'vitest'
import {
  generateWaybill,
  bookShippingPickup,
  getShippingBooking,
  getDynamicTrackingTimeline,
  ShippingBookingRecord,
} from '@/lib/shipping/biteship-client'

describe('Logistics Thermal Label & Real-Time Tracking Engine', () => {
  it('generates distinctive and valid AWB waybill numbers for JNE and Gojek', () => {
    const jneAwb = generateWaybill('JNE')
    expect(jneAwb).toMatch(/^JNE\d+$/)

    const gojekAwb = generateWaybill('GOJEK')
    expect(gojekAwb).toMatch(/^GK-\d+$/)

    const fallbackAwb = generateWaybill('')
    expect(fallbackAwb).toMatch(/^JNE\d+$/)
  })

  it('books shipping pickup and stores comprehensive shipping record with PT details', async () => {
    const mockParams = {
      orderId: 'test-order-999',
      orderNumber: 'ORD-20260921-9999',
      courierCode: 'GOJEK' as const,
      courierService: 'INSTANT',
      originStore: {
        name: 'Roxy Mas Pusat',
        companyName: 'PT Gadget Jaya Sentosa',
        address: 'ITC Roxy Mas Lt. 2 No. 15',
        city: 'Jakarta Pusat',
        phone: '081234567890',
        latitude: -6.1627,
        longitude: 106.8048,
        postalCode: '10150',
      },
      destinationCustomer: {
        name: 'Budi Santoso',
        address: 'Jl. Kemang Raya No. 45',
        city: 'Jakarta Selatan',
        province: 'DKI Jakarta',
        postalCode: '12730',
        phone: '085712345678',
        latitude: -6.2615,
        longitude: 106.8106,
      },
      items: [
        {
          name: 'iPhone 15 Pro Max 256GB Natural Titanium',
          quantity: 1,
          weightGram: 350,
          price: 21999000,
        },
      ],
    }

    const booking = await bookShippingPickup(mockParams)

    expect(booking.orderId).toBe('test-order-999')
    expect(booking.orderNumber).toBe('ORD-20260921-9999')
    expect(booking.courierCode).toBe('GOJEK')
    expect(booking.courierService).toBe('INSTANT')
    expect(booking.trackingNumber).toMatch(/^GK-\d+$/)
    expect(booking.status).toBe('ALLOCATED')
    expect(booking.driver).toBeDefined()
    expect(booking.driver?.name).toBeDefined()
    expect(booking.driver?.plateNumber).toBeDefined()
    expect(booking.originStore.companyName).toBe('PT Gadget Jaya Sentosa')
    expect(booking.destinationCustomer.name).toBe('Budi Santoso')
    expect(booking.items).toHaveLength(1)
    expect(booking.items[0].name).toContain('iPhone 15 Pro Max')

    // Verify storage persistence retrieval
    const retrieved = getShippingBooking('test-order-999')
    expect(retrieved).not.toBeNull()
    expect(retrieved?.orderId).toBe('test-order-999')
  })

  it('generates JNE manifest checkpoint with proper gateway hub progression', async () => {
    const mockParams = {
      orderId: 'test-order-jne-123',
      orderNumber: 'ORD-20260921-1234',
      courierCode: 'JNE' as const,
      courierService: 'YES',
      originStore: {
        name: 'WTC Surabaya',
        companyName: 'PT Sinar Gadget Nusantara',
        address: 'WTC Mall Lt. 3 No. 301',
        city: 'Surabaya',
        phone: '081299988877',
      },
      destinationCustomer: {
        name: 'Siti Aminah',
        address: 'Jl. Pemuda No. 12',
        city: 'Surabaya',
        province: 'Jawa Timur',
        phone: '081388877766',
      },
      items: [
        {
          name: 'Samsung Galaxy S24 Ultra 512GB',
          quantity: 1,
          weightGram: 450,
          price: 19999000,
        },
      ],
    }

    const booking = await bookShippingPickup(mockParams)

    expect(booking.courierCode).toBe('JNE')
    expect(booking.courierService).toBe('YES')
    expect(booking.trackingNumber).toMatch(/^JNE\d+$/)
    expect(booking.checkpoints[0].status).toBe('MANIFEST_GENERATED')
    expect(booking.checkpoints[0].description).toContain('JNE')
  })

  it('updates dynamic tracking timeline as time elapses for Gojek Instant', () => {
    const pastTime = new Date(Date.now() - 5 * 60 * 1000).toISOString() // 5 minutes ago

    const record: ShippingBookingRecord = {
      orderId: 'dynamic-gojek-order',
      orderNumber: 'ORD-DYNAMIC-01',
      courierCode: 'GOJEK',
      courierService: 'INSTANT',
      trackingNumber: 'GK-2609218888',
      status: 'ALLOCATED',
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
          location: 'Roxy Mas Pusat',
          timestamp: pastTime,
        },
      ],
      bookedAt: pastTime,
      originStore: {
        name: 'Roxy Mas Pusat',
        companyName: 'PT Gadget Jaya Sentosa',
        address: 'ITC Roxy Mas',
        city: 'Jakarta Pusat',
        phone: '081234567890',
      },
      destinationCustomer: {
        name: 'Budi Santoso',
        address: 'Jl. Kemang Raya No. 45',
        city: 'Jakarta Selatan',
        province: 'DKI Jakarta',
        phone: '085712345678',
      },
      items: [{ name: 'Gadget', quantity: 1, weightGram: 500 }],
    }

    const updated = getDynamicTrackingTimeline(record)

    // After 5 minutes, it should have picked up and be on the way
    expect(updated.checkpoints.length).toBeGreaterThanOrEqual(3)
    expect(updated.checkpoints.some((c) => c.status === 'PICKED_UP')).toBe(true)
    expect(updated.checkpoints.some((c) => c.status === 'ON_THE_WAY')).toBe(
      true
    )
    expect(updated.status).toBe('DROPPING_OFF')
  })
})
