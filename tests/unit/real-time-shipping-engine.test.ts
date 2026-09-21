import { describe, it, expect } from 'vitest'
import {
  calculateDistanceKm,
  calculateShippingOptions,
  verifyServerShippingCost,
  ShippingLocation,
  ShippingItem,
  GOJEK_BASE_FARE,
  JNE_BASE_COST_INTRA_CITY,
  JNE_BASE_COST_OUTER_JAVA,
} from '@/lib/shipping/shipping-engine'

describe('Real-Time Shipping Engine & Shopee Distance Calibration', () => {
  // Koordinat Toko: Roxy Mas Jakarta Pusat (-6.1627, 106.8048)
  const storeJakarta: ShippingLocation = {
    latitude: -6.1627,
    longitude: 106.8048,
    city: 'Jakarta Pusat',
    province: 'DKI Jakarta',
    postalCode: '10150',
  }

  // Koordinat Toko: WTC Surabaya (-7.2654, 112.7521)
  const storeSurabaya: ShippingLocation = {
    latitude: -7.2654,
    longitude: 112.7521,
    city: 'Surabaya',
    province: 'Jawa Timur',
    postalCode: '60271',
  }

  // 1. Uji Akurasi Jarak Haversine
  describe('Haversine Distance Calculation', () => {
    it('menghitung jarak ~0 km jika titik asal dan tujuan identik', () => {
      const distance = calculateDistanceKm(
        storeJakarta.latitude!,
        storeJakarta.longitude!,
        storeJakarta.latitude!,
        storeJakarta.longitude!
      )
      expect(distance).toBe(0)
    })

    it('menghitung jarak Jakarta Pusat ke Kebayoran Baru Jakarta Selatan (~8-15 km jalan darat)', () => {
      // Monas / Roxy ke Blok M (-6.2436, 106.7978)
      const distance = calculateDistanceKm(-6.1627, 106.8048, -6.2436, 106.7978)
      expect(distance).toBeGreaterThan(8)
      expect(distance).toBeLessThan(16)
    })

    it('menghitung jarak Jakarta ke Surabaya (~700-900 km estimasi jalan darat)', () => {
      const distance = calculateDistanceKm(
        storeJakarta.latitude!,
        storeJakarta.longitude!,
        storeSurabaya.latitude!,
        storeSurabaya.longitude!
      )
      expect(distance).toBeGreaterThan(700)
      expect(distance).toBeLessThan(950)
    })
  })

  // 2. Uji Aturan Gojek Instant (Maksimal 40 km)
  describe('Gojek Instant Radius Rules (Max 40 km)', () => {
    it('mengizinkan Gojek Instant jika jarak <= 40 km', async () => {
      // Jarak ~15 km (Jakarta Pusat ke Depok utara / Cinere)
      const destNearby: ShippingLocation = {
        latitude: -6.315,
        longitude: 106.785,
        city: 'Depok',
        province: 'Jawa Barat',
      }

      const items: ShippingItem[] = [{ weightGram: 500, quantity: 1 }]
      const result = await calculateShippingOptions(
        storeJakarta,
        destNearby,
        items
      )

      const gojek = result.options.find((o) => o.courierCode === 'GOJEK')
      expect(gojek).toBeDefined()
      expect(gojek?.available).toBe(true)
      expect(result.distanceKm).toBeLessThanOrEqual(40)
    })

    it('menolak Gojek Instant dan menandai unavailable jika jarak > 40 km', async () => {
      // Jarak Jakarta ke Surabaya (~800 km)
      const items: ShippingItem[] = [{ weightGram: 500, quantity: 1 }]
      const result = await calculateShippingOptions(
        storeJakarta,
        storeSurabaya,
        items
      )

      const gojek = result.options.find((o) => o.courierCode === 'GOJEK')
      expect(gojek).toBeDefined()
      expect(gojek?.available).toBe(false)
      expect(gojek?.unavailableReason).toContain('40 km')
    })

    it('menghitung tarif Gojek: base Rp 20.000 untuk <= 4 km', async () => {
      // Jarak sangat dekat (< 4 km)
      const destVeryNear: ShippingLocation = {
        latitude: -6.17,
        longitude: 106.81,
        city: 'Jakarta Pusat',
        province: 'DKI Jakarta',
      }
      const items: ShippingItem[] = [{ weightGram: 400, quantity: 1 }]
      const result = await calculateShippingOptions(
        storeJakarta,
        destVeryNear,
        items
      )

      const gojek = result.options.find((o) => o.courierCode === 'GOJEK')
      expect(gojek?.cost).toBe(GOJEK_BASE_FARE)
    })
  })

  // 3. Uji JNE Express (Reguler & YES)
  describe('JNE Express Real-Time Rates', () => {
    it('memberikan tarif JNE REG intra-city yang terjangkau (Rp 12.000) untuk berat < 1kg', async () => {
      const destJakarta: ShippingLocation = {
        city: 'Jakarta Barat',
        province: 'DKI Jakarta',
      }
      const items: ShippingItem[] = [{ weightGram: 600, quantity: 1 }]
      const result = await calculateShippingOptions(
        storeJakarta,
        destJakarta,
        items
      )

      const jneReg = result.options.find(
        (o) => o.courierCode === 'JNE' && o.courierService === 'REG'
      )
      expect(jneReg).toBeDefined()
      expect(jneReg?.cost).toBe(JNE_BASE_COST_INTRA_CITY)
      expect(jneReg?.etd).toContain('Hari')
    })

    it('memberikan tarif JNE YES dengan prioritas 1 hari esok sampai (1.75x multiplier)', async () => {
      const destJakarta: ShippingLocation = {
        city: 'Jakarta Barat',
        province: 'DKI Jakarta',
      }
      const items: ShippingItem[] = [{ weightGram: 600, quantity: 1 }]
      const result = await calculateShippingOptions(
        storeJakarta,
        destJakarta,
        items
      )

      const jneReg = result.options.find(
        (o) => o.courierCode === 'JNE' && o.courierService === 'REG'
      )
      const jneYes = result.options.find(
        (o) => o.courierCode === 'JNE' && o.courierService === 'YES'
      )

      expect(jneYes).toBeDefined()
      expect(jneYes?.cost).toBeGreaterThan(jneReg!.cost)
      expect(jneYes?.cost).toBe(21_000) // Math.round(12000 * 1.75)
      expect(jneYes?.etd).toContain('1 Hari')
    })

    it('menghitung tarif antar pulau (Jakarta ke Medan / Bali) secara akurat', async () => {
      const destMedan: ShippingLocation = {
        city: 'Medan',
        province: 'Sumatera Utara',
      }
      const items: ShippingItem[] = [{ weightGram: 500, quantity: 1 }]
      const result = await calculateShippingOptions(
        storeJakarta,
        destMedan,
        items
      )

      const jneReg = result.options.find(
        (o) => o.courierCode === 'JNE' && o.courierService === 'REG'
      )
      expect(jneReg?.cost).toBe(JNE_BASE_COST_OUTER_JAVA) // Inter-island base rate
    })

    it('melipatgandakan tarif jika berat mencapai 2 kg (pembulatan ke atas)', async () => {
      const destJakarta: ShippingLocation = {
        city: 'Jakarta Barat',
        province: 'DKI Jakarta',
      }
      const items: ShippingItem[] = [
        { weightGram: 1200, quantity: 1 }, // > 1kg -> 2 kg billed
      ]
      const result = await calculateShippingOptions(
        storeJakarta,
        destJakarta,
        items
      )

      const jneReg = result.options.find(
        (o) => o.courierCode === 'JNE' && o.courierService === 'REG'
      )
      expect(result.billedKg).toBe(2)
      expect(jneReg?.cost).toBe(24_000) // 12.000 * 2 kg
    })
  })

  // 4. Uji Verifikasi Server (Anti-Tampering)
  describe('Server-Side Shipping Integrity Verification', () => {
    it('memverifikasi biaya kurir JNE REG sesuai standar server', async () => {
      const items: ShippingItem[] = [{ weightGram: 500, quantity: 1 }]
      const verification = await verifyServerShippingCost(
        storeJakarta,
        { city: 'Jakarta Selatan', province: 'DKI Jakarta' },
        'JNE',
        'REG',
        items
      )

      expect(verification.available).toBe(true)
      expect(verification.cost).toBe(JNE_BASE_COST_INTRA_CITY)
    })

    it('menolak pengiriman Gojek jika koordinat menunjukkan jarak di luar 40 km', async () => {
      const items: ShippingItem[] = [{ weightGram: 500, quantity: 1 }]
      const verification = await verifyServerShippingCost(
        storeJakarta,
        storeSurabaya, // ~800 km
        'GOJEK',
        'INSTANT',
        items
      )

      expect(verification.available).toBe(false)
      expect(verification.reason).toContain('40 km')
    })
  })
})
