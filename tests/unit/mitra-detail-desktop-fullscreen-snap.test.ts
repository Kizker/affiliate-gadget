import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Mitra Detail Desktop Balanced Layout Suite', () => {
  const filePath = path.join(
    process.cwd(),
    'src/app/rekomendasi/[id]/mitra-detail-client.tsx'
  )
  const content = fs.readFileSync(filePath, 'utf-8')

  it('verifies outer container has natural scroll flow and eliminates rigid snap-container on desktop', () => {
    expect(content).not.toContain('id="snap-container"')
    expect(content).not.toContain('md:snap-container')
    expect(content).toContain('min-h-screen bg-white')
    expect(content).toContain('<main className="w-full">')
  })

  it('verifies all desktop sections have balanced proportional spacing without rigid md:h-screen or md:snap-start', () => {
    // 1. Hero
    expect(content).toContain('id="hero"')
    expect(content).not.toContain(
      'id="hero"\n          className="relative hidden w-full overflow-hidden bg-[#FBFBFD] pt-16 dark:bg-neutral-950 md:flex md:h-screen md:snap-start'
    )
    expect(content).toContain('max-w-7xl items-center')

    // 2. Banner Editorial
    expect(content).toContain('id="banner-editorial"')
    expect(content).toContain('px-4 py-6 sm:px-6 sm:py-10 lg:px-8')

    // 3. Katalog Layanan
    expect(content).toContain('id="katalog-layanan"')
    expect(content).toContain(
      'border-y border-neutral-100 bg-[#F8F9FA] px-4 py-8'
    )

    // 4. Keunggulan
    expect(content).toContain('id="keunggulan"')
    expect(content).toContain('px-4 py-8 sm:px-6 sm:py-12 lg:px-8')

    // 5. Galeri Workshop
    expect(content).toContain('id="galeri-workshop"')
    expect(content).toContain(
      'border-t border-neutral-100 bg-[#FBFBFD] px-4 py-8'
    )

    // 6. Informasi Mitra
    expect(content).toContain('id="informasi-mitra"')
    expect(content).toContain('border-t border-neutral-100 px-4 py-8')

    // 7. Ulasan Pelanggan
    expect(content).toContain('id="ulasan-pelanggan"')
    expect(content).toContain(
      'border-t border-neutral-100 bg-[#FBFBFD] px-4 py-8'
    )
  })

  it('verifies Footer is included at the bottom of the mitra detail page', () => {
    expect(content).toContain('<Footer />')
    expect(content).toContain(
      "import { Footer } from '@/components/layouts/footer'"
    )
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
