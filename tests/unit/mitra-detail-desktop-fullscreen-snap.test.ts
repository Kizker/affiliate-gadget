import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { isMitraCurrentlyOpen } from '@/lib/mitra-utils'

describe('Mitra Detail Desktop Balanced Layout Suite', () => {
  const pagePath = path.join(process.cwd(), 'src/app/rekomendasi/[id]/page.tsx')
  const clientPath = path.join(
    process.cwd(),
    'src/app/rekomendasi/[id]/mitra-detail-client.tsx'
  )
  const componentsDir = path.join(process.cwd(), 'src/components/rekomendasi')

  const pageContent = fs.readFileSync(pagePath, 'utf-8')
  const clientContent = fs.readFileSync(clientPath, 'utf-8')

  // Read all sub-components content to verify complete UI coverage
  const subComponentFiles = fs.readdirSync(componentsDir)
  const allSubComponentsContent = subComponentFiles
    .map((file) => fs.readFileSync(path.join(componentsDir, file), 'utf-8'))
    .join('\n')

  const combinedContent = `${pageContent}\n${clientContent}\n${allSubComponentsContent}`

  it('verifies outer container has natural scrolling and balanced layout without artificial 100vh lock', () => {
    expect(clientContent).toContain('<main className="w-full')
    expect(clientContent).not.toContain('md:snap-container')
    expect(clientContent).not.toContain('md:snap-mandatory')
    expect(clientContent).not.toContain('md:h-screen md:overflow-hidden')
  })

  it('verifies all sections have compact, balanced vertical spacing without forced 100vh', () => {
    // 1. Hero
    expect(combinedContent).toContain('id="hero"')
    expect(combinedContent).toContain('max-w-7xl items-center')

    // 2. Banner Editorial
    expect(combinedContent).toContain('id="banner-editorial"')

    // 3. Katalog Layanan
    expect(combinedContent).toContain('id="katalog-layanan"')

    // 4. Keunggulan
    expect(combinedContent).toContain('id="keunggulan"')

    // 5. Galeri Workshop
    expect(combinedContent).toContain('id="galeri-workshop"')

    // 6. Informasi Mitra
    expect(combinedContent).toContain('id="informasi-mitra"')

    // 7. Ulasan Pelanggan
    expect(combinedContent).toContain('id="ulasan-pelanggan"')

    // Bebas dari pemaksaan 100vh yang membuat jarak antar section terlalu jauh
    expect(allSubComponentsContent).not.toContain(
      "minHeight: '100vh', height: '100vh'"
    )
    expect(allSubComponentsContent).not.toContain('md:snap-start')
  })

  it('verifies Footer is included at the bottom of the mitra detail page', () => {
    expect(combinedContent).toContain('<Footer />')
    expect(pageContent).toContain(
      "import { Footer } from '@/components/layouts/footer'"
    )
  })

  it('verifies mobile hero has centered fading card over full-cover image with compact height', () => {
    expect(combinedContent).toContain('min-h-[460px]')
    expect(combinedContent).toContain('backdrop-blur-xl')
    expect(combinedContent).toContain('max-w-sm rounded-3xl')
  })

  it('verifies keunggulan section is displayed in 1 line on mobile and capped at 5 features', () => {
    expect(combinedContent).toContain('features.slice(0, 5)')
    expect(combinedContent).toContain('overflow-x-auto')
  })

  it('verifies documentation gallery is capped at 5 images on screen with lightbox back/next navigation', () => {
    expect(combinedContent).toContain('images.slice(0, 5)')
    expect(combinedContent).toContain('<ImageLightbox')
  })

  it('verifies getMapsUrl points directly to registered coordinates or location pin', () => {
    expect(clientContent).toContain('https://maps.google.com/?q=')
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

  it('verifies code-splitting and dynamic imports for heavy components', () => {
    // Dynamic imports verification
    expect(combinedContent).toContain(
      "import('@/components/reviews/review-modal')"
    )
    expect(combinedContent).toContain(
      "import('@/components/reviews/review-list')"
    )
    expect(combinedContent).toContain(
      "import('@/components/gallery/image-lightbox')"
    )
    expect(combinedContent).toContain(
      "import('@/components/maps/google-map-display')"
    )
    expect(combinedContent).toContain(
      "import('@/components/maps/google-maps-provider')"
    )
  })

  it('verifies accurate isOpen calculation via isMitraCurrentlyOpen', () => {
    // Monday at 14:00 WIB (2026-10-12 07:00 UTC) -> should be open
    const mondayAfternoon = new Date('2026-10-12T07:00:00Z')
    expect(
      isMitraCurrentlyOpen(
        '09:00 - 20:00 WIB',
        '10:00 - 18:00 WIB',
        mondayAfternoon
      )
    ).toBe(true)

    // Monday at 22:30 WIB (2026-10-12 15:30 UTC) -> should be closed
    const mondayNight = new Date('2026-10-12T15:30:00Z')
    expect(
      isMitraCurrentlyOpen(
        '09:00 - 20:00 WIB',
        '10:00 - 18:00 WIB',
        mondayNight
      )
    ).toBe(false)

    // Closed explicitly
    expect(isMitraCurrentlyOpen('Tutup', 'Tutup', mondayAfternoon)).toBe(false)

    // No hours set
    expect(isMitraCurrentlyOpen(null, null, mondayAfternoon)).toBe(false)
  })

  it('verifies dedicated user-status review endpoint exists and client uses it', () => {
    const userStatusApiPath = path.join(
      process.cwd(),
      'src/app/api/reviews/user-status/route.ts'
    )
    expect(fs.existsSync(userStatusApiPath)).toBe(true)
    const userStatusContent = fs.readFileSync(userStatusApiPath, 'utf-8')
    expect(userStatusContent).toContain('prisma.review.findFirst')
    expect(userStatusContent).toContain('hasReview:')

    expect(clientContent).toContain('/api/reviews/user-status?mitraId=')
    expect(clientContent).not.toContain('/api/reviews?mitraId=')
  })
})
