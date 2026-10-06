import { NextRequest, NextResponse } from 'next/server'
import { INDONESIA_PROVINCES } from '@/data/indonesia-regions'

export const dynamic = 'force-dynamic'

interface NominatimResponse {
  display_name?: string
  address?: {
    road?: string
    pedestrian?: string
    street?: string
    house_number?: string
    neighbourhood?: string
    city_block?: string
    village?: string
    suburb?: string
    hamlet?: string
    city_district?: string
    district?: string
    county?: string
    city?: string
    municipality?: string
    town?: string
    state?: string
    province?: string
    region?: string
    postcode?: string
    country?: string
  }
}

/**
 * Normalizes province name from Nominatim (e.g., "Daerah Khusus Ibukota Jakarta" -> "DKI Jakarta")
 */
function normalizeProvince(rawProvince?: string): string {
  if (!rawProvince) return ''
  const lower = rawProvince.toLowerCase().trim()
  if (lower.includes('jakarta') || lower.includes('dki')) return 'DKI Jakarta'
  if (lower.includes('yogyakarta') || lower.includes('diy'))
    return 'DI Yogyakarta'

  // Match against known Indonesian provinces
  for (const prov of INDONESIA_PROVINCES) {
    if (
      prov.name.toLowerCase() === lower ||
      lower.includes(prov.name.toLowerCase()) ||
      prov.name.toLowerCase().includes(lower)
    ) {
      return prov.name
    }
  }

  return rawProvince
}

/**
 * Matches city name against known cities in Indonesia
 */
function normalizeCity(rawCity?: string, provinceName?: string): string {
  if (!rawCity) return ''
  const cleanCity = rawCity
    .replace(/^(Kota\s+|Kabupaten\s+|Kab\.\s+|Daerah Khusus Ibukota\s+)/i, '')
    .trim()

  if (provinceName) {
    const prov = INDONESIA_PROVINCES.find(
      (p) => p.name.toLowerCase() === provinceName.toLowerCase()
    )
    if (prov) {
      const foundCity = prov.cities.find(
        (c) =>
          c.name.toLowerCase().includes(cleanCity.toLowerCase()) ||
          cleanCity.toLowerCase().includes(c.name.toLowerCase())
      )
      if (foundCity) return foundCity.name
    }
  }

  return cleanCity
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const latParam = searchParams.get('lat')
    const lngParam = searchParams.get('lng')

    const lat = latParam ? parseFloat(latParam) : -6.2088
    const lng = lngParam ? parseFloat(lngParam) : 106.8456

    // Query OpenStreetMap Nominatim reverse geocoding
    const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`

    let data: NominatimResponse | null = null

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 4000)

      const res = await fetch(osmUrl, {
        headers: {
          'User-Agent':
            'AffiliateGadgetPlatform/1.0 (contact@affiliategadget.com)',
          'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
        },
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (res.ok) {
        data = await res.json()
      }
    } catch (fetchErr) {
      console.warn('Nominatim reverse geocode fetch error/timeout:', fetchErr)
    }

    const addr = data?.address || {}

    const road = addr.road || addr.pedestrian || addr.street || ''
    const houseNumber = addr.house_number ? ` No. ${addr.house_number}` : ''
    const block = addr.city_block ? ` ${addr.city_block}` : ''
    const village =
      addr.village || addr.suburb || addr.hamlet || addr.neighbourhood || ''
    const district = addr.city_district || addr.district || addr.suburb || ''
    const rawCity =
      addr.city ||
      addr.municipality ||
      addr.city_district ||
      addr.town ||
      addr.county ||
      'Jakarta Selatan'
    const rawProvince =
      addr.state || addr.province || addr.region || 'DKI Jakarta'
    const postalCode = addr.postcode || ''

    const province = normalizeProvince(rawProvince)
    const city = normalizeCity(rawCity, province)

    // Construct clear, natural Indonesian fullAddress
    let fullAddress = ''
    if (road) {
      fullAddress += road + houseNumber
      if (block) fullAddress += `, ${block}`
      if (village) fullAddress += `, Kel. ${village}`
      if (district) fullAddress += `, Kec. ${district}`
    } else if (data?.display_name) {
      // Use clean portion of display name
      const parts = data.display_name.split(',')
      fullAddress = parts.slice(0, 3).join(',').trim()
    } else {
      fullAddress = `Jl. Dekat Titik Koordinat (${lat.toFixed(5)}, ${lng.toFixed(5)})`
    }

    return NextResponse.json({
      success: true,
      lat,
      lng,
      fullAddress,
      road,
      village,
      district,
      city,
      province,
      postalCode,
      displayName: data?.display_name || fullAddress,
    })
  } catch (error: any) {
    console.error('Reverse geocode handler error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Gagal memproses geolokasi',
        lat: -6.2088,
        lng: 106.8456,
        fullAddress: 'Jl. Jenderal Sudirman No. 1, Jakarta',
        city: 'Jakarta Pusat',
        province: 'DKI Jakarta',
        postalCode: '10110',
      },
      { status: 500 }
    )
  }
}
