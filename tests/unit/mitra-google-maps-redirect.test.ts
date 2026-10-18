import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Mitra Google Maps Input & Direct User Redirect Suite', () => {
  const schemaPath = path.resolve(process.cwd(), 'prisma/schema.prisma')
  const apiProfilePath = path.resolve(
    process.cwd(),
    'src/app/api/mitra/profile/route.ts'
  )
  const editPagePath = path.resolve(
    process.cwd(),
    'src/app/dashboard/mitra/profile/edit/page.tsx'
  )
  const detailClientPath = path.resolve(
    process.cwd(),
    'src/app/rekomendasi/[id]/mitra-detail-client.tsx'
  )
  const infoPath = path.resolve(
    process.cwd(),
    'src/components/rekomendasi/mitra-info.tsx'
  )
  const mobileViewPath = path.resolve(
    process.cwd(),
    'src/components/rekomendasi/mitra-mobile-view.tsx'
  )
  const heroPath = path.resolve(
    process.cwd(),
    'src/components/rekomendasi/mitra-hero.tsx'
  )
  const serviceViewPath = path.resolve(
    process.cwd(),
    'src/components/service/integrated-service-view.tsx'
  )

  const schemaContent = fs.readFileSync(schemaPath, 'utf-8')
  const apiProfileContent = fs.readFileSync(apiProfilePath, 'utf-8')
  const editContent = fs.readFileSync(editPagePath, 'utf-8')
  const detailClientContent = fs.readFileSync(detailClientPath, 'utf-8')
  const infoContent = fs.readFileSync(infoPath, 'utf-8')
  const mobileViewContent = fs.readFileSync(mobileViewPath, 'utf-8')
  const heroContent = fs.readFileSync(heroPath, 'utf-8')
  const serviceViewContent = fs.readFileSync(serviceViewPath, 'utf-8')

  const geoSearchRoutePath = path.resolve(
    process.cwd(),
    'src/app/api/geo/search/route.ts'
  )
  const geoSearchRouteContent = fs.readFileSync(geoSearchRoutePath, 'utf-8')

  it('1. Database schema & API profile route support mapsUrl', () => {
    // Schema must have mapsUrl in Mitra model
    expect(schemaContent).toMatch(/model Mitra \{[\s\S]*?mapsUrl\s+String\?/)
    // API must handle mapsUrl in update & create
    expect(apiProfileContent).toContain('body.mapsUrl')
    expect(apiProfileContent).toContain('UPDATE "mitras" SET "mapsUrl"')
  })

  it('2. Mitra Profile Edit allows searching location like Google Maps, auto-adjusts physical address & integrates map picker', () => {
    // Form edit must have Google Maps search input & query state
    expect(editContent).toContain('value={mapSearchQuery}')
    expect(editContent).toContain('/api/geo/search?q=')
    expect(editContent).toContain('handleSelectSearchResult')
    // Dropdown only appears when user actively types or edits, closes on outside click
    expect(editContent).toContain('isUserTypingRef')
    expect(editContent).toContain('searchContainerRef')
    expect(editContent).toContain('handleClickOutside')
    // Must have direct Google Maps search helper
    expect(editContent).toContain('handleOpenGoogleMapsSearch')
    expect(editContent).toContain('Cari di Google Maps ↗')
    // Must have GPS detection button
    expect(editContent).toContain('handleGetCurrentLocationGps')
    expect(editContent).toContain('GPS Saat Ini')
    // Must integrate AddressMapPicker
    expect(editContent).toContain('<AddressMapPicker')
    // Must include address, city, and province
    expect(editContent).toContain('value={profile.address}')
    expect(editContent).toContain('value={profile.city}')
    expect(editContent).toContain('value={profile.province}')
    // Must notify partner of active redirection
    expect(editContent).toContain('Redirect Otomatis Aktif')
  })

  it('3. Forward Geocoding Search Route (/api/geo/search) supports Google Places API, URL coordinate parsing, and 100% free multi-tier geocoding', () => {
    expect(geoSearchRouteContent).toContain('export async function GET')
    expect(geoSearchRouteContent).toContain('reverseGeocodeCoords')
    expect(geoSearchRouteContent).toContain('place/textsearch/json')
    expect(geoSearchRouteContent).toContain('photon.komoot.io')
    expect(geoSearchRouteContent).toContain(
      'nominatim.openstreetmap.org/search'
    )
    expect(geoSearchRouteContent).toContain('normalizeProvince')
    expect(geoSearchRouteContent).toContain('normalizeCity')
    expect(geoSearchRouteContent).toContain('mapsUrl:')
  })

  it('4. Public Mitra Detail Client prioritizes custom mapsUrl and resolves valid Google Maps redirect link', () => {
    // detail client must check mitra.mapsUrl first
    expect(detailClientContent).toContain(
      "if (mitra.mapsUrl && mitra.mapsUrl.trim().startsWith('http'))"
    )
    expect(detailClientContent).toContain('return mitra.mapsUrl.trim()')
    // fallbacks to lat/lng and query
    expect(detailClientContent).toContain(
      'https://maps.google.com/?q=${mitra.latitude},${mitra.longitude}'
    )
  })

  it('5. User clicking partner address in Desktop & Mobile directly opens Google Maps', () => {
    // Desktop Info Workshop address is a clickable link to mapsUrl with target="_blank"
    expect(infoContent).toContain('href={mapsUrl}')
    expect(infoContent).toContain('target="_blank"')
    expect(infoContent).toContain('group/addr block')
    // Mobile View address card is a clickable link to mapsUrl with target="_blank"
    expect(mobileViewContent).toContain('href={mapsUrl}')
    expect(mobileViewContent).toContain('target="_blank"')
    // Desktop Hero quick info chip is a clickable link to mapsUrl with target="_blank"
    expect(heroContent).toContain('href={mapsUrl}')
    expect(heroContent).toContain('target="_blank"')
    // Service listing cards open googleMapsUrl in target="_blank"
    expect(serviceViewContent).toContain('href={mitra.googleMapsUrl}')
    expect(serviceViewContent).toContain('target="_blank"')
  })

  it('6. AddressMapPicker overlay control badges are concise and single-line with whitespace-nowrap', () => {
    const mapPickerPath = path.resolve(
      process.cwd(),
      'src/components/maps/address-map-picker.tsx'
    )
    const mapPickerContent = fs.readFileSync(mapPickerPath, 'utf-8')

    // Ringkas satu baris untuk tombol petunjuk pin dan deteksi GPS
    expect(mapPickerContent).toContain('Klik Peta')
    expect(mapPickerContent).toContain('Deteksi GPS')
    expect(mapPickerContent).toContain('whitespace-nowrap')
    expect(mapPickerContent).not.toContain('Klik peta untuk pindahkan pin')
    expect(mapPickerContent).not.toContain('Deteksi GPS Saya')
  })
})
