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

export const REGIONAL_CENTROIDS: Record<string, { lat: number; lng: number }> =
  {
    // DKI Jakarta & Jabodetabek
    'dki jakarta': { lat: -6.2088, lng: 106.8456 },
    jakarta: { lat: -6.2088, lng: 106.8456 },
    'jakarta pusat': { lat: -6.1805, lng: 106.8284 },
    'jakarta selatan': { lat: -6.2615, lng: 106.8106 },
    'jakarta barat': { lat: -6.1683, lng: 106.7588 },
    'jakarta timur': { lat: -6.225, lng: 106.9004 },
    'jakarta utara': { lat: -6.1384, lng: 106.864 },
    bogor: { lat: -6.5971, lng: 106.806 },
    depok: { lat: -6.4025, lng: 106.7942 },
    tangerang: { lat: -6.1783, lng: 106.6319 },
    'tangerang selatan': { lat: -6.2889, lng: 106.7179 },
    bekasi: { lat: -6.2383, lng: 106.9756 },

    // Pulau Jawa
    'jawa barat': { lat: -6.9175, lng: 107.6191 },
    bandung: { lat: -6.9175, lng: 107.6191 },
    'jawa tengah': { lat: -6.9667, lng: 110.4167 },
    semarang: { lat: -6.9667, lng: 110.4167 },
    'di yogyakarta': { lat: -7.7956, lng: 110.3695 },
    yogyakarta: { lat: -7.7956, lng: 110.3695 },
    'jawa timur': { lat: -7.2575, lng: 112.7521 },
    surabaya: { lat: -7.2575, lng: 112.7521 },
    banten: { lat: -6.12, lng: 106.1503 },
    serang: { lat: -6.12, lng: 106.1503 },

    // Sumatera
    'sumatera selatan': { lat: -3.5, lng: 104.25 },
    palembang: { lat: -2.9761, lng: 104.7754 },
    'ogan komering ulu': { lat: -4.13, lng: 104.17 },
    baturaja: { lat: -4.13, lng: 104.17 },
    lampung: { lat: -5.4297, lng: 105.2625 },
    'bandar lampung': { lat: -5.4297, lng: 105.2625 },
    'sumatera utara': { lat: 3.5952, lng: 98.6722 },
    medan: { lat: 3.5952, lng: 98.6722 },
    'sumatera barat': { lat: -0.9471, lng: 100.4172 },
    padang: { lat: -0.9471, lng: 100.4172 },
    riau: { lat: 0.5071, lng: 101.4478 },
    pekanbaru: { lat: 0.5071, lng: 101.4478 },
    jambi: { lat: -1.6101, lng: 103.6131 },
    bengkulu: { lat: -3.8004, lng: 102.2655 },
    'kepulauan bangka belitung': { lat: -2.1333, lng: 106.1167 },
    'kepulauan riau': { lat: 0.9167, lng: 104.45 },
    batam: { lat: 1.0456, lng: 104.0305 },
    aceh: { lat: 5.5483, lng: 95.3238 },
    'banda aceh': { lat: 5.5483, lng: 95.3238 },

    // Bali & Nusa Tenggara
    bali: { lat: -8.6705, lng: 115.2126 },
    denpasar: { lat: -8.6705, lng: 115.2126 },
    'nusa tenggara barat': { lat: -8.5833, lng: 116.1167 },
    mataram: { lat: -8.5833, lng: 116.1167 },
    'nusa tenggara timur': { lat: -10.1772, lng: 123.607 },
    kupang: { lat: -10.1772, lng: 123.607 },

    // Kalimantan
    'kalimantan barat': { lat: -0.0263, lng: 109.3425 },
    pontianak: { lat: -0.0263, lng: 109.3425 },
    'kalimantan tengah': { lat: -2.2105, lng: 113.9213 },
    palangkaraya: { lat: -2.2105, lng: 113.9213 },
    'kalimantan selatan': { lat: -3.3194, lng: 114.5908 },
    banjarmasin: { lat: -3.3194, lng: 114.5908 },
    'kalimantan timur': { lat: -0.5022, lng: 117.1536 },
    samarinda: { lat: -0.5022, lng: 117.1536 },
    balikpapan: { lat: -1.2654, lng: 116.8312 },
    'kalimantan utara': { lat: 2.8333, lng: 117.3833 },

    // Sulawesi
    'sulawesi selatan': { lat: -5.1477, lng: 119.4327 },
    makassar: { lat: -5.1477, lng: 119.4327 },
    'sulawesi utara': { lat: 1.4748, lng: 124.8421 },
    manado: { lat: 1.4748, lng: 124.8421 },
    'sulawesi tengah': { lat: -0.9003, lng: 119.878 },
    palu: { lat: -0.9003, lng: 119.878 },
    'sulawesi tenggara': { lat: -3.9985, lng: 122.5126 },
    kendari: { lat: -3.9985, lng: 122.5126 },
    gorontalo: { lat: 0.5435, lng: 123.0568 },
    'sulawesi barat': { lat: -2.6773, lng: 118.889 },

    // Maluku & Papua
    maluku: { lat: -3.6547, lng: 128.1906 },
    ambon: { lat: -3.6547, lng: 128.1906 },
    'maluku utara': { lat: 0.7893, lng: 127.361 },
    papua: { lat: -2.5337, lng: 140.7181 },
    jayapura: { lat: -2.5337, lng: 140.7181 },
    'papua barat': { lat: -0.8615, lng: 134.062 },
  }

export function findRegionalCoord(
  city?: string | null,
  province?: string | null
): { lat: number; lng: number } | null {
  const normCity = normalizeRegion(city)
  const normProv = normalizeRegion(province)

  if (normCity) {
    for (const [key, coord] of Object.entries(REGIONAL_CENTROIDS)) {
      if (
        normCity === key ||
        normCity.includes(key) ||
        key.includes(normCity)
      ) {
        return coord
      }
    }
  }

  if (normProv) {
    for (const [key, coord] of Object.entries(REGIONAL_CENTROIDS)) {
      if (
        normProv === key ||
        normProv.includes(key) ||
        key.includes(normProv)
      ) {
        return coord
      }
    }
  }

  return null
}

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
  const isSameMetro = isSameMetropolitanArea(
    origin.city,
    destination.city,
    origin.province,
    destination.province
  )

  let distanceKm: number | null = null
  const origLat = typeof origin.latitude === 'number' ? origin.latitude : null
  const origLng = typeof origin.longitude === 'number' ? origin.longitude : null
  const destLat =
    typeof destination.latitude === 'number' ? destination.latitude : null
  const destLng =
    typeof destination.longitude === 'number' ? destination.longitude : null

  // Geographical sanity check:
  // If regions are clearly in different metropolitan areas / provinces, but GPS coordinates are virtually identical (< 50 km),
  // coordinates are mismatched (e.g. laptop GPS captured in Jakarta while store is in Palembang/Ogan Komering Ulu).
  let hasCoordMismatch = false
  if (
    origLat !== null &&
    origLng !== null &&
    destLat !== null &&
    destLng !== null
  ) {
    const rawDist = calculateHaversineDistance(
      origLat,
      origLng,
      destLat,
      destLng
    )
    if (!isSameMetro && rawDist < 50) {
      hasCoordMismatch = true
    } else {
      distanceKm = rawDist
    }
  }

  // If coordinates are missing or mismatched, fallback to regional centroid coordinates
  if (distanceKm === null || hasCoordMismatch) {
    const oCoord = findRegionalCoord(origin.city, origin.province)
    const dCoord = findRegionalCoord(destination.city, destination.province)
    if (oCoord && dCoord) {
      distanceKm = calculateHaversineDistance(
        oCoord.lat,
        oCoord.lng,
        dCoord.lat,
        dCoord.lng
      )
    }
  }

  // 3. Coba Live Biteship API
  const liveOptions = await fetchBiteshipRates(
    origin,
    destination,
    items,
    safeTotalWeight
  )

  if (liveOptions && liveOptions.length > 0) {
    // Ensure Gojek option is present with accurate availability based on distance & metropolitan area
    const hasGojek = liveOptions.some((o) => o.courierCode === 'GOJEK')
    if (!hasGojek) {
      liveOptions.push({
        courierCode: 'GOJEK',
        courierService: 'INSTANT',
        serviceName: 'Gojek Instant Kurir',
        courierName: 'Gojek',
        description:
          'Di luar area jangkauan pengiriman instan Gojek (Biteship)',
        cost: 0,
        etd: '1-2 Jam',
        available: false,
        unavailableReason:
          distanceKm !== null && distanceKm > GOJEK_MAX_DISTANCE_KM
            ? `Jarak pengiriman (${distanceKm.toFixed(1)} km) melebihi batas maksimal Gojek Instant (40 km).`
            : 'Di luar area jangkauan pengiriman instan Gojek (maksimal 40 km).',
        distanceKm: distanceKm ?? undefined,
      })
    } else {
      // Validate Gojek in live options against distance & metropolitan boundary
      for (const opt of liveOptions) {
        if (opt.courierCode === 'GOJEK') {
          if (
            !isSameMetro ||
            (distanceKm !== null && distanceKm > GOJEK_MAX_DISTANCE_KM)
          ) {
            opt.available = false
            opt.unavailableReason = `Jarak pengiriman (${(distanceKm ?? 80).toFixed(1)} km) melebihi batas maksimal Gojek Instant (40 km).`
          }
        }
      }
    }

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

  // --- Opsi A: Gojek Instant (Jarak Dekat, Radius <= 40 km, dan WAJIB dalam wilayah metropolitan yang sama) ---
  const effectiveGojekDistance =
    distanceKm !== null ? distanceKm : isSameMetro ? 10 : 150
  const isGojekAvailable =
    isSameMetro && effectiveGojekDistance <= GOJEK_MAX_DISTANCE_KM

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
