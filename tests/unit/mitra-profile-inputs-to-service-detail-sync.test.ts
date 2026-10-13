import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Mitra Profile Inputs to Service Detail 1:1 Mapping Verification Suite', () => {
  const editPagePath = path.resolve(
    process.cwd(),
    'src/app/dashboard/mitra/profile/edit/page.tsx'
  )
  const heroPath = path.resolve(
    process.cwd(),
    'src/components/rekomendasi/mitra-hero.tsx'
  )
  const editorialPath = path.resolve(
    process.cwd(),
    'src/components/rekomendasi/mitra-editorial-banner.tsx'
  )
  const serviceCatalogPath = path.resolve(
    process.cwd(),
    'src/components/rekomendasi/mitra-service-catalog.tsx'
  )
  const featuresPath = path.resolve(
    process.cwd(),
    'src/components/rekomendasi/mitra-features.tsx'
  )
  const galleryPath = path.resolve(
    process.cwd(),
    'src/components/rekomendasi/mitra-gallery.tsx'
  )
  const infoPath = path.resolve(
    process.cwd(),
    'src/components/rekomendasi/mitra-info.tsx'
  )

  const editContent = fs.readFileSync(editPagePath, 'utf-8')
  const heroContent = fs.readFileSync(heroPath, 'utf-8')
  const editorialContent = fs.readFileSync(editorialPath, 'utf-8')
  const serviceCatalogContent = fs.readFileSync(serviceCatalogPath, 'utf-8')
  const featuresContent = fs.readFileSync(featuresPath, 'utf-8')
  const galleryContent = fs.readFileSync(galleryPath, 'utf-8')
  const infoContent = fs.readFileSync(infoPath, 'utf-8')

  it('1. Input Nama Toko, Tagline, dan Deskripsi Toko di Halaman Edit Profil muncul di Hero Section', () => {
    // Form edit memiliki input name, tagline, description
    expect(editContent).toContain('value={profile.name}')
    expect(editContent).toContain('value={profile.tagline}')
    expect(editContent).toContain('value={profile.description}')

    // Hero section menampilkan businessName
    expect(heroContent).toContain('{mitra.businessName}')
    // Hero section menampilkan tagline
    expect(heroContent).toContain('mitra.tagline')
    // Hero section menampilkan description
    expect(heroContent).toContain('mitra.description')
  })

  it('2. Deskripsi Toko mitra ditampilkan di Editorial Campaign Banner & Info Kredibilitas', () => {
    // Editorial banner memprioritaskan description yang diisi mitra
    expect(editorialContent).toContain('mitra.description')
    // Info kredibilitas menampilkan deskripsi profil
    expect(infoContent).toContain('mitra.description')
  })

  it('3. Layanan & Tarif yang diinputkan mitra muncul di Katalog Servis dengan icon, nama, harga & aksi chat', () => {
    // Form edit memiliki input layanan
    expect(editContent).toContain('value={newService.name}')
    expect(editContent).toContain('value={newService.price}')
    expect(editContent).toContain('SERVICE_ICONS')

    // Katalog servis me-render service.name, service.price, service.icon
    expect(serviceCatalogContent).toContain('{service.name}')
    expect(serviceCatalogContent).toContain('service.price')
    expect(serviceCatalogContent).toContain('{service.icon}')
    expect(serviceCatalogContent).toContain('onBookingChat')
  })

  it('4. Keunggulan toko (features) yang dipilih mitra tampil di Keunggulan Layanan', () => {
    expect(editContent).toContain('FEATURE_OPTIONS')
    expect(editContent).toContain('profile.features')
    expect(featuresContent).toContain('features.slice(0, 5)')
    expect(featuresContent).toContain('{feature}')
  })

  it('5. Galeri Workshop foto yang diunggah mitra tampil di Galeri Dokumentasi Workshop', () => {
    expect(editContent).toContain('MultiImageUpload')
    expect(editContent).toContain('profile.gallery')
    expect(galleryContent).toContain('images.slice(0, 5)')
    expect(galleryContent).toContain('ImageWithFallback')
    expect(galleryContent).toContain('setLightboxOpen(true)')
  })

  it('6. Kontak resmi (telepon, email, website) dan Jam Operasional tampil di Info Workshop', () => {
    expect(editContent).toContain('profile.phone')
    expect(editContent).toContain('profile.email')
    expect(editContent).toContain('profile.website')
    expect(editContent).toContain('profile.hours.weekday')
    expect(editContent).toContain('profile.hours.weekend')

    // Info workshop menampilkan jam kerja dan detail kontak
    expect(infoContent).toContain('mitra.weekdayHours')
    expect(infoContent).toContain('mitra.phone')
    expect(infoContent).toContain('mitra.email')
    expect(infoContent).toContain('mitra.website')
  })

  it('7. Alamat, Kota, Provinsi & Koordinat Peta tampil di Hero dan Google Maps', () => {
    expect(heroContent).toContain('{mitra.city}')
    expect(infoContent).toContain('{mitra.address}')
    expect(infoContent).toContain('{mitra.city}')
    expect(infoContent).toContain('{mitra.province}')
    expect(infoContent).toContain('GoogleMapDisplay')
  })
})
