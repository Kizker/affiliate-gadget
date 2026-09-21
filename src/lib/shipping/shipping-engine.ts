/**
 * Shipping Engine - Real-Time Shopee-Style Logistics Calculation
 * Integrasi Gojek Instant & JNE Express (YES 1 Hari, REG 2-3 Hari, OKE 3-5 Hari)
 * Mendukung Live Biteship API & Shopee-Calibrated Real Distance / Zone Fallback Engine
 */

export interface ShippingLocation {
  latitude?: number | null
  longitude?: number | null
  city?: string | null
  province?: string | null
  district?: string | null
  postalCode?: string | null
  fullAddress?: string | null
}

export interface ShippingItem {
  name?: string | null
  weightGram: number
  price?: number
  quantity?: number
  productId?: string
}

export interface ShippingOption {
  courierCode: 'GOJEK' | 'JNE'
  courierService: 'INSTANT' | 'SAMEDAY' | 'REG' | 'YES' | 'OKE'
  serviceName: string
  courierName: string
  description: string
  cost: number
  etd: string // e.g. "1-2 Jam", "1 Hari (Esok Sampai)", "2-3 Hari"
  available: boolean
  unavailableReason?: string
  distanceKm?: number
  isRecommended?: boolean
}

export interface ShippingCalculationResult {
  options: ShippingOption[]
  distanceKm: number | null
  origin: {
    name?: string
    city?: string
    province?: string
  }
  destination: {
    city?: string
    province?: string
  }
  billedKg: number
  totalWeightGram: number
}

// Konfigurasi Standar Logistik Indonesia
export const GOJEK_MAX_DISTANCE_KM = 40 // Batas maksimal Gojek Instant di Indonesia
export const GOJEK_BASE_FARE = 20_000 // Tarif dasar 0 - 4 km
export const GOJEK_FARE_PER_KM = 2_500 // Tarif per km setelah 4 km

export const JNE_BASE_COST_INTRA_CITY = 12_000 // Tarif dasar intra-kota / Jabodetabek per kg
export const JNE_BASE_COST_INTER_JAVA = 19_000 // Tarif dasar antar-kota Pulau Jawa per kg
export const JNE_BASE_COST_OUTER_JAVA = 38_000 // Tarif dasar Luar Jawa (Sumatera/Bali/NTB) per kg
export const JNE_BASE_COST_EAST_INDONESIA = 85_000 // Tarif dasar Indonesia Timur (Maluku/Papua) per kg

export const JNE_YES_MULTIPLIER = 1.75 // Pengali paket YES (1 Hari / Esok Sampai)
export const JNE_OKE_MULTIPLIER = 0.85 // Pengali paket OKE (Ekonomis)

/**
 * Hitung jarak lurus (Great Circle Distance) dengan Haversine Formula dalam Kilometer.
 */
export function calculateHaversineDistance(
  lat1?: number | null,
  lon1?: number | null,
  lat2?: number | null,
  lon2?: number | null
): number {
  if (
    lat1 === null ||
    lat1 === undefined ||
    lon1 === null ||
    lon1 === undefined ||
    lat2 === null ||
    lat2 === undefined ||
    lon2 === null ||
    lon2 === undefined
  ) {
    return 0
  }
  const R = 6371 // Radius Bumi dalam km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const directDistance = R * c

  // Rute jalan darat di Indonesia rata-rata ~25% lebih panjang dari garis lurus udara
  const estimatedRoadDistance = directDistance * 1.25
  return Math.round(estimatedRoadDistance * 10) / 10 // Pembulatan 1 desimal
}

export const calculateDistanceKm = calculateHaversineDistance

/**
 * Normalisasi nama kota / provinsi untuk pengecekan wilayah.
 */
function normalizeRegion(name?: string | null): string {
  if (!name) return ''
  return name
    .toLowerCase()
    .replace(/^(kota|kabupaten|kab\.|adm\.)\s+/i, '')
    .trim()
}

/**
 * Cek apakah dua wilayah berada di pulau/zona yang sama di Indonesia.
 */
export function isSameMetropolitanArea(
  city1?: string | null,
  city2?: string | null,
  prov1?: string | null,
  prov2?: string | null
): boolean {
  const c1 = normalizeRegion(city1)
  const c2 = normalizeRegion(city2)
  const p1 = normalizeRegion(prov1)
  const p2 = normalizeRegion(prov2)

  if (c1 && c2 && (c1 === c2 || c1.includes(c2) || c2.includes(c1))) {
    return true
  }

  // Jabodetabek
  const jabodetabek = [
    'jakarta',
    'bogor',
    'depok',
    'tangerang',
    'bekasi',
    'jakarta pusat',
    'jakarta selatan',
    'jakarta barat',
    'jakarta timur',
    'jakarta utara',
    'tangerang selatan',
  ]
  const isC1Jabo = jabodetabek.some((j) => c1.includes(j))
  const isC2Jabo = jabodetabek.some((j) => c2.includes(j))
  if (isC1Jabo && isC2Jabo) return true

  // Surabaya & Sidoarjo / Gresik (Gerbangkertosusila)
  const gerbang = ['surabaya', 'sidoarjo', 'gresik']
  const isC1Gerbang = gerbang.some((g) => c1.includes(g))
  const isC2Gerbang = gerbang.some((g) => c2.includes(g))
  if (isC1Gerbang && isC2Gerbang) return true

  // Bandung Raya
  const bandungRaya = ['bandung', 'cimahi', 'bandung barat']
  const isC1Bdg = bandungRaya.some((b) => c1.includes(b))
  const isC2Bdg = bandungRaya.some((b) => c2.includes(b))
  if (isC1Bdg && isC2Bdg) return true

  return false
}

/**
 * Tentukan tarif dasar JNE REG per kg berdasarkan zona asal & tujuan.
 */
export function determineJneBaseRate(
  originCity?: string | null,
  destCity?: string | null,
  originProv?: string | null,
  destProv?: string | null
): number {
  const oCity = normalizeRegion(originCity)
  const dCity = normalizeRegion(destCity)
  const oProv = normalizeRegion(originProv)
  const dProv = normalizeRegion(destProv)

  // 1. Intra-City / Sesama Kota / Jabodetabek
  if (
    oCity === dCity ||
    isSameMetropolitanArea(originCity, destCity, originProv, destProv)
  ) {
    return JNE_BASE_COST_INTRA_CITY
  }

  // 2. Sesama Provinsi
  if (oProv && dProv && oProv === dProv) {
    return JNE_BASE_COST_INTRA_CITY + 4_000 // Rp 16.000
  }

  // Daftar provinsi di Pulau Jawa
  const javaProvinces = [
    'dki jakarta',
    'jakarta',
    'jawa barat',
    'jawa tengah',
    'di yogyakarta',
    'yogyakarta',
    'jawa timur',
    'banten',
  ]
  const isOriginJava = javaProvinces.some((p) => oProv.includes(p))
  const isDestJava = javaProvinces.some((p) => dProv.includes(p))

  // 3. Antar-kota Pulau Jawa
  if (isOriginJava && isDestJava) {
    return JNE_BASE_COST_INTER_JAVA
  }

  // Daftar wilayah Indonesia Timur (Maluku & Papua)
  const eastIndonesia = ['papua', 'maluku', 'papua barat', 'papua tengah']
  const isDestEast = eastIndonesia.some((p) => dProv.includes(p))
  if (isDestEast) {
    return JNE_BASE_COST_EAST_INDONESIA
  }

  // 4. Luar Jawa (Sumatera, Kalimantan, Sulawesi, Bali, Nusa Tenggara)
  return JNE_BASE_COST_OUTER_JAVA
}

/**
 * Panggil Live Biteship API jika API key tersedia di .env
 */
async function fetchBiteshipRates(
  origin: ShippingLocation,
  destination: ShippingLocation,
  items: ShippingItem[],
  totalWeightGram: number
): Promise<ShippingOption[] | null> {
  const apiKey = process.env.BITESHIP_API_KEY
  if (!apiKey) return null

  try {
    const payload = {
      origin_latitude: origin.latitude,
      origin_longitude: origin.longitude,
      origin_postal_code: origin.postalCode,
      destination_latitude: destination.latitude,
      destination_longitude: destination.longitude,
      destination_postal_code: destination.postalCode,
      couriers: 'jne,gojek',
      items: items.map((i) => ({
        name: i.name || 'Gadget Unit',
        value: i.price || 1_000_000,
        weight: i.weightGram || 500,
        quantity: i.quantity || 1,
      })),
    }

    const res = await fetch('https://api.biteship.com/v1/rates/couriers', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      console.warn('Biteship API response not ok:', res.status)
      return null
    }

    const data = await res.json()
    if (!data.pricing || !Array.isArray(data.pricing)) return null

    const options: ShippingOption[] = []

    for (const rate of data.pricing) {
      const courierLower = (
        rate.courier_name ||
        rate.courier_code ||
        ''
      ).toLowerCase()
      const serviceLower = (
        rate.courier_service_code ||
        rate.service_type ||
        ''
      ).toLowerCase()

      if (courierLower.includes('gojek')) {
        options.push({
          courierCode: 'GOJEK',
          courierService: 'INSTANT',
          serviceName: 'Gojek Instant Kurir',
          courierName: 'Gojek',
          description: 'Langsung Sampai (Maks 1-2 Jam)',
          cost: rate.price || 20_000,
          etd: rate.shipment_duration_range || '1-2 Jam',
          available: rate.available !== false,
          unavailableReason:
            rate.available === false ? 'Driver tidak tersedia' : undefined,
          isRecommended: true,
        })
      } else if (courierLower.includes('jne')) {
        if (serviceLower.includes('yes')) {
          options.push({
            courierCode: 'JNE',
            courierService: 'YES',
            serviceName: 'JNE YES (Yakin Esok Sampai)',
            courierName: 'JNE Express',
            description: 'Pengiriman 1 Hari (Besok Pasti Sampai)',
            cost: rate.price || 35_000,
            etd: '1 Hari (Esok Sampai)',
            available: true,
          })
        } else if (serviceLower.includes('reg')) {
          options.push({
            courierCode: 'JNE',
            courierService: 'REG',
            serviceName: 'JNE Reguler (REG)',
            courierName: 'JNE Express',
            description: 'Layanan Pengiriman Reguler Berasuransi',
            cost: rate.price || 19_000,
            etd: rate.shipment_duration_range || '2-3 Hari',
            available: true,
          })
        }
      }
    }

    return options.length > 0 ? options : null
  } catch (err) {
    console.error(
      'Failed to call Biteship API, falling back to dynamic engine:',
      err
    )
    return null
  }
}

/**
 * Kalkulasi Opsi Pengiriman Real-Time Shopee-Style.
 * Jika Biteship API tersedia, panggil live API.
 * Jika tidak, jalankan Shopee-Calibrated Real Distance & Regional Zone Engine.
 */
export async function calculateShippingOptions(
  origin: ShippingLocation,
  destination: ShippingLocation,
  items: ShippingItem[] = []
): Promise<ShippingCalculationResult> {
  // 1. Hitung akumulasi berat
  const totalWeightGram = items.reduce((sum, item) => {
    const itemWeight =
      item.weightGram && item.weightGram > 0 ? item.weightGram : 500
    const qty = item.quantity && item.quantity > 0 ? item.quantity : 1
    return sum + itemWeight * qty
  }, 0)

  const safeTotalWeight = Math.max(500, totalWeightGram)
  const billedKg = Math.max(1, Math.ceil(safeTotalWeight / 1000))

  // 2. Cek apakah ada koordinat untuk perhitungan jarak
  let distanceKm: number | null = null
  if (
    typeof origin.latitude === 'number' &&
    typeof origin.longitude === 'number' &&
    typeof destination.latitude === 'number' &&
    typeof destination.longitude === 'number'
  ) {
    distanceKm = calculateHaversineDistance(
      origin.latitude,
      origin.longitude,
      destination.latitude,
      destination.longitude
    )
  }

  // 3. Coba Live Biteship API
  const liveOptions = await fetchBiteshipRates(
    origin,
    destination,
    items,
    safeTotalWeight
  )

  if (liveOptions && liveOptions.length > 0) {
    return {
      options: liveOptions,
      distanceKm,
      origin: {
        city: origin.city || undefined,
        province: origin.province || undefined,
      },
      destination: {
        city: destination.city || undefined,
        province: destination.province || undefined,
      },
      billedKg,
      totalWeightGram: safeTotalWeight,
    }
  }

  // 4. Shopee-Calibrated Fallback Engine
  const options: ShippingOption[] = []

  // --- Opsi A: Gojek Instant (Jarak Dekat, Radius <= 40 km) ---
  const isSameMetro = isSameMetropolitanArea(
    origin.city,
    destination.city,
    origin.province,
    destination.province
  )

  const effectiveGojekDistance =
    distanceKm !== null ? distanceKm : isSameMetro ? 10 : 80
  const isGojekAvailable =
    effectiveGojekDistance <= GOJEK_MAX_DISTANCE_KM &&
    (isSameMetro || distanceKm !== null)

  let gojekCost = GOJEK_BASE_FARE
  if (effectiveGojekDistance > 4) {
    const extraKm = effectiveGojekDistance - 4
    gojekCost = GOJEK_BASE_FARE + Math.round(extraKm * GOJEK_FARE_PER_KM)
  }
  // Pembulatan ke kelipatan Rp 500
  gojekCost = Math.ceil(gojekCost / 500) * 500

  // Tambahan biaya jika berat > 5kg (Gojek Instant max motor 20kg)
  if (billedKg > 5) {
    gojekCost += (billedKg - 5) * 5_000
  }

  options.push({
    courierCode: 'GOJEK',
    courierService: 'INSTANT',
    serviceName: 'Gojek Instant Kurir',
    courierName: 'Gojek',
    description: isGojekAvailable
      ? 'Langsung Sampai (Maks 1-2 Jam)'
      : `Jarak pengiriman (${effectiveGojekDistance.toFixed(1)} km) melebihi batas maksimal Gojek Instant (40 km)`,
    cost: gojekCost,
    etd: '1-2 Jam',
    available: isGojekAvailable,
    unavailableReason: !isGojekAvailable
      ? `Jarak pengiriman (${effectiveGojekDistance.toFixed(1)} km) melebihi batas maksimal 40 km. Silakan gunakan JNE Express.`
      : undefined,
    distanceKm: effectiveGojekDistance,
    isRecommended: isGojekAvailable,
  })

  // --- Opsi B: JNE Reguler (2-3 Hari Kerja) ---
  const jneBasePerKg = determineJneBaseRate(
    origin.city,
    destination.city,
    origin.province,
    destination.province
  )

  // 1 kg pertama = tarif dasar, kg berikutnya = tarif dasar (standar tarif ekspedisi per kg)
  const jneRegCost = jneBasePerKg * billedKg

  options.push({
    courierCode: 'JNE',
    courierService: 'REG',
    serviceName: 'JNE Reguler (REG)',
    courierName: 'JNE Express',
    description: 'Pengiriman reguler berasuransi resmi seluruh Indonesia',
    cost: jneRegCost,
    etd: isSameMetro ? '1-2 Hari Kerja' : '2-3 Hari Kerja',
    available: true,
    distanceKm: distanceKm ?? undefined,
    isRecommended: !isGojekAvailable,
  })

  // --- Opsi C: JNE YES (1 Hari / Esok Sampai) ---
  // JNE YES tersedia untuk sebagian besar kota tujuan
  const jneYesCost = Math.round(jneRegCost * JNE_YES_MULTIPLIER)
  const roundedJneYesCost = Math.ceil(jneYesCost / 1000) * 1000

  options.push({
    courierCode: 'JNE',
    courierService: 'YES',
    serviceName: 'JNE YES (Yakin Esok Sampai)',
    courierName: 'JNE Express',
    description: 'Layanan Kilat 1 Hari Sampai (Besok Pasti Tiba)',
    cost: roundedJneYesCost,
    etd: '1 Hari (Esok Sampai)',
    available: true,
    distanceKm: distanceKm ?? undefined,
  })

  // --- Opsi D: JNE OKE (3-5 Hari Kerja / Ekonomis) ---
  const jneOkeCost = Math.round(jneRegCost * JNE_OKE_MULTIPLIER)
  const roundedJneOkeCost = Math.ceil(jneOkeCost / 1000) * 1000

  options.push({
    courierCode: 'JNE',
    courierService: 'OKE',
    serviceName: 'JNE OKE (Ongkos Kirim Ekonomis)',
    courierName: 'JNE Express',
    description: 'Layanan Hemat Ekonomis dengan estimasi hemat',
    cost: roundedJneOkeCost,
    etd: '3-5 Hari Kerja',
    available: true,
    distanceKm: distanceKm ?? undefined,
  })

  return {
    options,
    distanceKm,
    origin: {
      city: origin.city || undefined,
      province: origin.province || undefined,
    },
    destination: {
      city: destination.city || undefined,
      province: destination.province || undefined,
    },
    billedKg,
    totalWeightGram: safeTotalWeight,
  }
}

/**
 * Validasi dan kalkulasi tarif tunggal di sisi server untuk verifikasi checkout.
 */
export async function verifyServerShippingCost(
  origin: ShippingLocation,
  destination: ShippingLocation,
  courierCode: string,
  courierService: string,
  items: ShippingItem[] = []
): Promise<{ cost: number; available: boolean; reason?: string }> {
  const result = await calculateShippingOptions(origin, destination, items)
  const normalizedCourier = (courierCode || 'JNE').toUpperCase()
  const normalizedService = (courierService || 'REG').toUpperCase()

  const match = result.options.find(
    (o) =>
      o.courierCode === normalizedCourier &&
      o.courierService === normalizedService
  )

  if (!match) {
    // Fallback jika service tidak ditemukan: ambil opsi kurir pertama yang cocok atau JNE REG
    const fallback =
      result.options.find((o) => o.courierCode === normalizedCourier) ||
      result.options.find(
        (o) => o.courierCode === 'JNE' && o.courierService === 'REG'
      ) ||
      result.options[0]

    return {
      cost: fallback ? fallback.cost : 15_000,
      available: fallback ? fallback.available : true,
      reason:
        fallback && !fallback.available
          ? fallback.unavailableReason
          : undefined,
    }
  }

  return {
    cost: match.cost,
    available: match.available,
    reason: match.unavailableReason,
  }
}
