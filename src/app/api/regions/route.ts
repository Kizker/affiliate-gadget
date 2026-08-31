import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory cache for ultra-fast repeated queries
const cache = new Map<string, any>()

// Helper to convert ALL CAPS names to clean Indonesian Title Case
function toTitleCase(str: string): string {
  if (!str) return ''
  // Keep standard acronyms like DKI, DI, IKN uppercase
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => {
      if (['dki', 'di', 'ikn', 'adm.'].includes(word)) {
        return word.toUpperCase()
      }
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'provinces'
    const provinceId = searchParams.get('provinceId')
    const regencyId = searchParams.get('regencyId')
    const districtId = searchParams.get('districtId')

    let targetUrl = ''
    let cacheKey = ''

    if (type === 'provinces') {
      targetUrl = 'https://emsifa.github.io/api-wilayah-indonesia/api/provinces.json'
      cacheKey = 'provinces'
    } else if (type === 'regencies' && provinceId) {
      targetUrl = `https://emsifa.github.io/api-wilayah-indonesia/api/regencies/${provinceId}.json`
      cacheKey = `regencies-${provinceId}`
    } else if (type === 'districts' && regencyId) {
      targetUrl = `https://emsifa.github.io/api-wilayah-indonesia/api/districts/${regencyId}.json`
      cacheKey = `districts-${regencyId}`
    } else if (type === 'villages' && districtId) {
      targetUrl = `https://emsifa.github.io/api-wilayah-indonesia/api/villages/${districtId}.json`
      cacheKey = `villages-${districtId}`
    } else {
      return NextResponse.json({ error: 'Parameter wilayah tidak valid' }, { status: 400 })
    }

    // Return from cache if present
    if (cache.has(cacheKey)) {
      return NextResponse.json(cache.get(cacheKey))
    }

    const res = await fetch(targetUrl, {
      next: { revalidate: 86400 * 7 }, // Cache for 7 days
    })

    if (!res.ok) {
      throw new Error(`Failed to fetch regions from source: ${res.statusText}`)
    }

    const rawData = await res.json()
    
    // Format names to clean Title Case
    const formattedData = rawData.map((item: any) => ({
      ...item,
      name: toTitleCase(item.name),
    }))

    // Save to in-memory cache
    cache.set(cacheKey, formattedData)

    return NextResponse.json(formattedData)
  } catch (error) {
    console.error('Error fetching Indonesian administrative regions:', error)
    return NextResponse.json(
      { error: 'Gagal memuat data wilayah Indonesia' },
      { status: 500 }
    )
  }
}
