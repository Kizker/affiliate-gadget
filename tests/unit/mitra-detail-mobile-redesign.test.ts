import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Mitra Detail World-Class Mobile Redesign Suite', () => {
  const rootDir = process.cwd()
  const mobileViewPath = path.join(
    rootDir,
    'src',
    'components',
    'rekomendasi',
    'mitra-mobile-view.tsx'
  )
  const clientPath = path.join(
    rootDir,
    'src',
    'app',
    'rekomendasi',
    '[id]',
    'mitra-detail-client.tsx'
  )

  const mobileContent = fs.readFileSync(mobileViewPath, 'utf-8')
  const clientContent = fs.readFileSync(clientPath, 'utf-8')

  it('1. verifies MitraDetailClient uses dedicated MitraMobileView on mobile viewport (< md)', () => {
    expect(clientContent).toContain('import {')
    expect(clientContent).toContain('MitraMobileView')
    expect(clientContent).toContain('<div className="block md:hidden">')
    expect(clientContent).toContain('<MitraMobileView')
  })

  it('2. verifies mobile view has full-screen 100dvh hero cover without "Mitra Servis Resmi" and store name in dead-center', () => {
    expect(mobileContent).toContain('h-[100dvh]')
    expect(mobileContent).not.toContain('Mitra Servis Resmi')
    expect(mobileContent).toContain('Buka Sekarang')
    expect(mobileContent).toContain('{mitra.businessName}')
    expect(mobileContent).toContain('href={mapsUrl}')
  })

  it('3. verifies minimalist scannable layout with clean section anchors', () => {
    expect(mobileContent).toContain('id="m-sec-layanan"')
    expect(mobileContent).toContain('id="m-sec-keunggulan"')
    expect(mobileContent).toContain('id="m-sec-info"')
    expect(mobileContent).toContain('id="m-sec-ulasan"')
  })

  it('4. verifies clean service catalog cards with vertically stacked name and price without labels to prevent clipping', () => {
    expect(mobileContent).toContain('id="m-sec-layanan"')
    expect(mobileContent).toContain('formatServicePrice(service.price)')
    expect(mobileContent).toContain('onBookingChat(e, service.name)')
    // Keterangan label dipangkas agar tidak terpotong
    expect(mobileContent).not.toContain('Estimasi Biaya')
    expect(mobileContent).not.toContain('Garansi 30 Hari')
  })

  it('5. verifies floating card keunggulan points capped at max 10', () => {
    expect(mobileContent).toContain('id="m-sec-keunggulan"')
    expect(mobileContent).toContain('activeFeatures.map')
    expect(mobileContent).toContain('features.slice(0, 10)')
    expect(mobileContent).toContain('Pengerjaan Kilat 2 Jam di Meja Teknisi')
  })

  it('6. verifies documentation gallery has horizontal carousel and ImageLightbox with ambient glow', () => {
    expect(mobileContent).toContain('id="m-sec-galeri"')
    expect(mobileContent).toContain('overflow-x-auto')
    expect(mobileContent).toContain('snap-x')
    expect(mobileContent).toContain('<ImageLightbox')

    const lightboxPath = path.join(
      rootDir,
      'src',
      'components',
      'gallery',
      'image-lightbox.tsx'
    )
    const lightboxContent = fs.readFileSync(lightboxPath, 'utf-8')
    expect(lightboxContent).toContain('blur-3xl')
    expect(lightboxContent).toContain('backdrop-blur-2xl')
  })

  it('7. verifies unified operational hours, phone call link, email, and website channels', () => {
    expect(mobileContent).toContain('id="m-sec-info"')
    expect(mobileContent).toContain('Hari Kerja:')
    expect(mobileContent).toContain('Akhir Pekan:')
    expect(mobileContent).toContain('href={`tel:${mitra.phone}`}')
    expect(mobileContent).toContain('href={`mailto:${mitra.email}`}')
  })

  it('8. verifies customer review card with score and ReviewList component', () => {
    expect(mobileContent).toContain('id="m-sec-ulasan"')
    expect(mobileContent).toContain('mitra.rating.toFixed(1)')
    expect(mobileContent).toContain('<ReviewList')
    expect(mobileContent).toContain('<ReviewModal')
  })

  it('9. verifies floating chat action button in bottom right to chat with mitra', () => {
    expect(mobileContent).toContain('fixed bottom-6 right-5')
    expect(mobileContent).toContain('Chat Mitra')
    expect(mobileContent).toContain('onBookingChat(e)')
  })
})
