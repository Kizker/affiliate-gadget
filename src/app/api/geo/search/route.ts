import { NextRequest, NextResponse } from 'next/server'
import { INDONESIA_PROVINCES } from '@/data/indonesia-regions'

export const dynamic = 'force-dynamic'

interface NominatimSearchResult {
  place_id?: number
  lat: string
  lon: string
  display_name: string
  name?: string
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

function normalizeProvince(rawProvince?: string): string {
  if (!rawProvince) return ''
  const lower = rawProvince.toLowerCase().trim()
  if (lower.includes('jakarta') || lower.includes('dki')) return 'DKI Jakarta'
  if (lower.includes('yogyakarta') || lower.includes('diy'))
    return 'DI Yogyakarta'

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

async function reverseGeocodeCoords(lat: number, lng: number) {
  try {
    const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3500)

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
      const data = await res.json()
      const addr = data?.address || {}
      const road = addr.road || addr.pedestrian || addr.street || ''
      const houseNumber = addr.house_number ? ` No. ${addr.house_number}` : ''
      const village = addr.village || addr.suburb || addr.neighbourhood || ''
      const district = addr.city_district || addr.district || addr.suburb || ''
      const rawCity =
        addr.city ||
        addr.municipality ||
        addr.town ||
        addr.county ||
        addr.city_district ||
        ''
      const rawProv = addr.state || addr.province || addr.region || ''

      const prov = normalizeProvince(rawProv)
      const city = normalizeCity(rawCity, prov)

      let fullAddress = ''
      if (road) {
        fullAddress += road + houseNumber
        if (village) fullAddress += `, Kel. ${village}`
        if (district) fullAddress += `, Kec. ${district}`
      } else if (data?.display_name) {
        fullAddress = data.display_name.split(',').slice(0, 3).join(',').trim()
      }

      return {
        fullAddress:
          fullAddress ||
          `Jl. Dekat Koordinat (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
        city: city || 'Jakarta Selatan',
        province: prov || 'DKI Jakarta',
      }
    }
  } catch (err) {
    console.warn('Reverse geocode coords warning:', err)
  }

  return {
    fullAddress: `Koordinat GPS (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
    city: 'Jakarta Selatan',
    province: 'DKI Jakarta',
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim() || ''

    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] })
    }

    // 1. Check if query is a Google Maps URL or contains coordinates
    const coordRegex = /(?:[@\?&]q?=?|^)(-?\d+\.\d{3,})[,\s]+(-?\d+\.\d{3,})/
    const coordMatch = q.match(coordRegex)
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1])
      const lng = parseFloat(coordMatch[2])
      const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`

      let placeTitle = ''
      const placeMatch = q.match(/\/place\/([^\/@\?]+)/)
      if (placeMatch) {
        placeTitle = decodeURIComponent(
          placeMatch[1].replace(/\+/g, ' ')
        ).trim()
      }

      const geoData = await reverseGeocodeCoords(lat, lng)

      return NextResponse.json({
        results: [
          {
            id: `coord-${lat}-${lng}`,
            title:
              placeTitle ||
              `Titik Lokasi (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
            fullAddress: `${geoData.fullAddress}${geoData.city ? `, ${geoData.city}` : ''}${
              geoData.province ? `, ${geoData.province}` : ''
            }`,
            city: geoData.city,
            province: geoData.province,
            latitude: lat,
            longitude: lng,
            mapsUrl,
          },
        ],
      })
    }

    const apiKey =
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
      process.env.GOOGLE_MAPS_API_KEY?.trim()

    // 2. If Google Maps API key available, query Google Places API
    if (apiKey) {
      try {
        const placesTextUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
          q
        )}&region=id&language=id&key=${apiKey}`

        const pRes = await fetch(placesTextUrl)
        if (pRes.ok) {
          const pData = await pRes.json()
          if (
            pData.status === 'OK' &&
            Array.isArray(pData.results) &&
            pData.results.length > 0
          ) {
            const results = pData.results.slice(0, 6).map((item: any) => {
              const lat = item.geometry.location.lat
              const lng = item.geometry.location.lng
              const formatted = item.formatted_address || ''
              const parts = formatted.split(',').map((p: string) => p.trim())
              let province = ''
              let city = ''

              for (const p of parts) {
                const normP = normalizeProvince(p)
                if (normP && normP !== p) {
                  province = normP
                  break
                }
              }
              for (const p of parts) {
                const normC = normalizeCity(p, province)
                if (normC && normC !== p) {
                  city = normC
                  break
                }
              }

              return {
                id: item.place_id || `place-${lat}-${lng}`,
                title: item.name || parts[0] || q,
                fullAddress: formatted,
                city: city || 'Jakarta Selatan',
                province: province || 'DKI Jakarta',
                latitude: lat,
                longitude: lng,
                mapsUrl: `https://www.google.com/maps/place/?q=place_id:${item.place_id}`,
              }
            })

            return NextResponse.json({ results })
          }
        }
      } catch (err) {
        console.warn('Google Places API search warning:', err)
      }
    }

    // 3. Smart 100% Free Geocoding Engine (Cleaned Nominatim + Photon POI Index)
    const cleanQ = q
      .replace(/\b(RT|RW)\s*\d+\b/gi, '')
      .replace(
        /\b(Kel\.?|Kelurahan|Kec\.?|Kecamatan|Desa|Kab\.?|Kabupaten|Kota)\b/gi,
        ''
      )
      .replace(/[,\s]+/g, ' ')
      .trim()

    const searchVariants = [q]
    if (cleanQ && cleanQ !== q && cleanQ.length > 3) {
      searchVariants.push(cleanQ)
    }

    const freeResults: Array<{
      id: string
      title: string
      fullAddress: string
      city: string
      province: string
      latitude: number
      longitude: number
      mapsUrl: string
    }> = []

    // A. Query OpenStreetMap Nominatim
    for (const variant of searchVariants) {
      try {
        const osmUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          variant
        )}&countrycodes=id&addressdetails=1&limit=5`

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 3500)

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
          const data: NominatimSearchResult[] = await res.json()
          if (Array.isArray(data) && data.length > 0) {
            data.forEach((item, idx) => {
              const addr = item.address || {}
              const lat = parseFloat(item.lat)
              const lng = parseFloat(item.lon)

              const provRaw = addr.state || addr.province || addr.region || ''
              const provName = normalizeProvince(provRaw)

              const cityRaw =
                addr.city ||
                addr.municipality ||
                addr.town ||
                addr.city_district ||
                addr.county ||
                ''
              const cityName = normalizeCity(cityRaw, provName)

              const road = addr.road || addr.pedestrian || addr.street || ''
              const houseNumber = addr.house_number
                ? ` No. ${addr.house_number}`
                : ''
              const street = road ? `${road}${houseNumber}` : ''

              const district =
                addr.city_district || addr.district || addr.suburb || ''
              const village =
                addr.village || addr.neighbourhood || addr.city_block || ''

              const areaParts = [street, village, district].filter(Boolean)
              const fullAddress =
                areaParts.length > 0
                  ? areaParts.join(', ')
                  : item.name ||
                    item.display_name.split(',').slice(0, 3).join(', ')

              const title =
                item.name ||
                street ||
                item.display_name.split(',')[0] ||
                `Lokasi ${idx + 1}`

              freeResults.push({
                id: `osm-${item.place_id || idx}-${lat}-${lng}`,
                title,
                fullAddress: `${fullAddress}${cityName ? `, ${cityName}` : ''}${
                  provName ? `, ${provName}` : ''
                }`,
                city: cityName,
                province: provName,
                latitude: lat,
                longitude: lng,
                mapsUrl: `https://maps.google.com/?q=${lat},${lng}`,
              })
            })
            break // Found good results from Nominatim
          }
        }
      } catch (e) {
        // Continue to fallback
      }
    }

    // B. If Nominatim has few results, augment with Photon POI / Landmark index
    if (freeResults.length < 3) {
      try {
        const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(
          cleanQ || q
        )}&limit=4`
        const pRes = await fetch(photonUrl)
        if (pRes.ok) {
          const pData = await pRes.json()
          if (Array.isArray(pData.features)) {
            pData.features.forEach((f: any, idx: number) => {
              const props = f.properties || {}
              const coords = f.geometry?.coordinates || []
              if (coords.length >= 2) {
                const lng = coords[0]
                const lat = coords[1]
                const provName = normalizeProvince(props.state)
                const cityName = normalizeCity(props.city, provName)

                const title = props.name || props.street || `Tempat ${idx + 1}`
                const fullAddress = [
                  props.name,
                  props.street,
                  cityName,
                  provName,
                ]
                  .filter(Boolean)
                  .join(', ')

                // Avoid duplicate coordinates
                const isDup = freeResults.some(
                  (r) =>
                    Math.abs(r.latitude - lat) < 0.0005 &&
                    Math.abs(r.longitude - lng) < 0.0005
                )

                if (!isDup) {
                  freeResults.push({
                    id: `photon-${idx}-${lat}-${lng}`,
                    title,
                    fullAddress,
                    city: cityName,
                    province: provName,
                    latitude: lat,
                    longitude: lng,
                    mapsUrl: `https://maps.google.com/?q=${lat},${lng}`,
                  })
                }
              }
            })
          }
        }
      } catch (e) {
        // ignore
      }
    }

    return NextResponse.json({ results: freeResults.slice(0, 6) })
  } catch (error) {
    console.error('Error in /api/geo/search:', error)
    return NextResponse.json({ results: [] })
  }
}
