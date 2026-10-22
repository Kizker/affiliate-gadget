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

  it('verifies desktop container uses natural scrolling without snap scroll locks', () => {
    expect(clientContent).not.toContain('id="snap-container"')
    expect(clientContent).not.toContain('md:snap-container')
    expect(clientContent).not.toContain('md:snap-y')
    expect(clientContent).not.toContain('md:snap-mandatory')
    expect(clientContent).not.toContain('md:overflow-y-scroll')
    expect(clientContent).not.toContain('md:overflow-hidden')
    expect(clientContent).toContain('<main className="w-full">')
  })

  it('verifies all 7 desktop sections have removed md:snap-start and 100vh height, and use balanced spacing matching store detail standard', () => {
    // 1. Hero
    expect(combinedContent).toContain('id="hero"')
    expect(combinedContent).toContain('max-w-7xl items-center')
    expect(combinedContent).toContain('pt-24')
    expect(combinedContent).toContain('sm:pt-28')

    // 2. Banner Editorial
    expect(combinedContent).toContain('id="banner-editorial"')
    expect(combinedContent).toContain('py-8')
    expect(combinedContent).toContain('sm:py-12')

    // 3. Katalog Layanan
    expect(combinedContent).toContain('id="katalog-layanan"')
    expect(combinedContent).toContain('scroll-mt-16')
    expect(combinedContent).toContain('py-10')

    // 4. Keunggulan
    expect(combinedContent).toContain('id="keunggulan"')
    expect(combinedContent).toContain('scroll-mt-16')

    // 5. Galeri Workshop
    expect(combinedContent).toContain('id="galeri-workshop"')
    expect(combinedContent).toContain('scroll-mt-16')

    // 6. Informasi Mitra
    expect(combinedContent).toContain('id="informasi-mitra"')
    expect(combinedContent).toContain('scroll-mt-16')

    // 7. Ulasan Pelanggan
    expect(combinedContent).toContain('id="ulasan-pelanggan"')
    expect(combinedContent).toContain('scroll-mt-16')

    // Desktop Fullscreen 100vh and snap locks are removed
    expect(allSubComponentsContent).not.toContain(
      "minHeight: '100vh', height: '100vh'"
    )
    expect(allSubComponentsContent).not.toContain('md:snap-start')
    expect(allSubComponentsContent).not.toContain('md:snap-y')
  })

  it('verifies Footer is included for desktop and mobile', () => {
    expect(combinedContent).toContain('<Footer')
    expect(pageContent).toContain(
      "import { Footer } from '@/components/layouts/footer'"
    )
  })

  it('verifies mobile hero has ultra-clean, professional banner layout with verified badge and fast action buttons', () => {
    expect(combinedContent).toContain('Mitra Servis Resmi')
    expect(combinedContent).toContain('rounded-b-[28px]')
    expect(combinedContent).toContain('Chat / Booking Servis')
    expect(combinedContent).toContain('<div className="block md:hidden">')
  })

  it('verifies keunggulan section is capped at 5 features from partner input', () => {
    expect(combinedContent).toContain('features.slice(0, 5)')
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
