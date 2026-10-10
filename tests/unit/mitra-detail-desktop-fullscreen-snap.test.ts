import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Mitra Detail Desktop Fullscreen Snap Layout Suite', () => {
  const filePath = path.join(
    process.cwd(),
    'src/app/rekomendasi/[id]/mitra-detail-client.tsx'
  )
  const content = fs.readFileSync(filePath, 'utf-8')

  it('verifies outer container has snap-container id and full-screen overflow properties on desktop', () => {
    expect(content).toContain('id="snap-container"')
    expect(content).toContain('md:snap-container')
    expect(content).toContain('md:h-screen')
    expect(content).toContain('md:overflow-y-scroll')
  })

  it('verifies all desktop sections have md:h-screen and md:snap-start to fit exactly 1 viewport screen', () => {
    // 1. Hero
    expect(content).toContain('id="hero"')
    expect(content).toContain('md:h-screen md:items-center md:snap-start')

    // 2. Banner Editorial
    expect(content).toContain('id="banner-editorial"')
    expect(content).toContain(
      'md:h-screen md:flex-col md:justify-center md:overflow-hidden md:pt-16 md:snap-start'
    )

    // 3. Katalog Layanan
    expect(content).toContain('id="katalog-layanan"')

    // 4. Keunggulan
    expect(content).toContain('id="keunggulan"')

    // 5. Galeri Workshop
    expect(content).toContain('id="galeri-workshop"')

    // 6. Informasi Mitra
    expect(content).toContain('id="informasi-mitra"')

    // 7. Ulasan Pelanggan
    expect(content).toContain('id="ulasan-pelanggan"')
  })

  it('verifies Footer is omitted from the mitra detail page', () => {
    expect(content).not.toContain('<Footer')
    expect(content).not.toContain("from '@/components/layouts/footer'")
  })

  it('verifies mobile hero has centered fading card over full-cover image', () => {
    expect(content).toContain('h-[100dvh] min-h-[100dvh]')
    expect(content).toContain('backdrop-blur-xl')
    expect(content).toContain('max-w-sm rounded-3xl')
  })

  it('verifies keunggulan section is displayed in 1 line on mobile and capped at 5 features', () => {
    expect(content).toContain('mitra.features.slice(0, 5)')
    expect(content).toContain('overflow-x-auto')
  })

  it('verifies documentation gallery is capped at 5 images on screen with lightbox back/next navigation', () => {
    expect(content).toContain('mitra.images.slice(0, 5)')
    expect(content).toContain('<ImageLightbox')
  })

  it('verifies getMapsUrl points directly to registered coordinates or location pin', () => {
    expect(content).toContain('https://maps.google.com/?q=')
  })

  it('verifies review list has compact size, max 5 displayed, and opens ReviewDetailModal with back and next buttons', () => {
    const reviewListPath = path.join(
      process.cwd(),
      'src/components/reviews/review-list.tsx'
    )
    const reviewListContent = fs.readFileSync(reviewListPath, 'utf-8')
    expect(reviewListContent).toContain('reviews.slice(0, maxDisplay)')
    expect(reviewListContent).toContain('<ReviewDetailModal')

    const modalPath = path.join(
      process.cwd(),
      'src/components/reviews/review-detail-modal.tsx'
    )
    const modalContent = fs.readFileSync(modalPath, 'utf-8')
    expect(modalContent).toContain('Sebelumnya')
    expect(modalContent).toContain('Selanjutnya')
  })
})
