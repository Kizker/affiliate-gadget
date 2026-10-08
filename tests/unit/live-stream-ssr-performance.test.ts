import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import {
  getLiveStreamInitialData,
  getGuestViewerToken,
  type LiveStreamDetail,
} from '@/lib/live-stream-data'

describe('Live Stream Lighthouse 95+ Performance & Accessibility Suite', () => {
  const viewerPath = path.resolve(
    process.cwd(),
    'src/components/live/live-stream-viewer.tsx'
  )
  const subscriberVideoPath = path.resolve(
    process.cwd(),
    'src/components/live/livekit-subscriber-video.tsx'
  )
  const livePagePath = path.resolve(process.cwd(), 'src/app/live/[id]/page.tsx')
  const layoutPath = path.resolve(process.cwd(), 'src/app/layout.tsx')

  const viewerContent = fs.readFileSync(viewerPath, 'utf-8')
  const subscriberVideoContent = fs.readFileSync(subscriberVideoPath, 'utf-8')
  const livePageContent = fs.readFileSync(livePagePath, 'utf-8')
  const layoutContent = fs.readFileSync(layoutPath, 'utf-8')

  it('1. LiveStreamViewer melakukan code-splitting total terhadap WebRTC LiveKit', () => {
    // Tidak boleh ada static import dari @livekit/components-react atau livekit-client di viewer
    expect(viewerContent).not.toMatch(/from '@livekit\/components-react'/)
    expect(viewerContent).not.toMatch(/from 'livekit-client'/)

    // Menggunakan dynamic import dengan ssr: false
    expect(viewerContent).toContain("import('./livekit-subscriber-video')")
    expect(viewerContent).toContain("import('./live-chat-panel')")
    expect(viewerContent).toContain("import('./live-product-pin')")
    expect(viewerContent).toContain("import('./floating-hearts')")
  })

  it('2. LiveKitSubscriberVideo mengisolasi SDK WebRTC dan menyertakan track caption aksesibilitas', () => {
    // Membawa import LiveKit secara terisolasi
    expect(subscriberVideoContent).toContain("from '@livekit/components-react'")
    expect(subscriberVideoContent).toContain("from 'livekit-client'")

    // Memiliki elemen track captions untuk kepatuhan Lighthouse Accessibility WCAG
    expect(subscriberVideoContent).toContain('<track')
    expect(subscriberVideoContent).toContain('kind="captions"')
    expect(subscriberVideoContent).toContain('/captions/live-empty.vtt')
    expect(subscriberVideoContent).toContain('role="region"')
    expect(subscriberVideoContent).toContain(
      'aria-label="Pemutar video siaran langsung"'
    )
  })

  it('3. Live Stream Page mengimplementasikan SSR preloading, preconnect, dan eliminasi bundle kotor', () => {
    // Dynamic force-dynamic untuk update status real-time
    expect(livePageContent).toContain("export const dynamic = 'force-dynamic'")

    // Mengambil stream data dan guest token di server
    expect(livePageContent).toContain('getLiveStreamInitialData(id)')
    expect(livePageContent).toContain('getGuestViewerToken(initialStream)')

    // Mengirim initialStream & initialToken ke viewer
    expect(livePageContent).toContain('initialStream={initialStream}')
    expect(livePageContent).toContain('initialToken={initialToken}')

    // Memiliki preconnect hints ke cloud domain WebRTC
    expect(livePageContent).toContain('rel="preconnect"')
    expect(livePageContent).toContain('rel="dns-prefetch"')

    // Memiliki tag main dengan ID dan role semantik
    expect(livePageContent).toContain('id="main-content"')
    expect(livePageContent).toContain('role="main"')

    // Tidak boleh ada rendering MobileBottomNav yang disembunyikan via hidden (eliminasi DOM waste)
    expect(livePageContent).not.toContain('<MobileBottomNav')

    // SEO canonical & robots
    expect(livePageContent).toContain('canonical:')
    expect(livePageContent).toContain('robots:')
  })

  it('4. Viewport konfigurasi mengizinkan user scaling untuk aksesibilitas WCAG 1.4.4', () => {
    // Memastikan maximumScale diset ke 5 untuk aksesibilitas zoom pengguna
    expect(layoutContent).toContain('maximumScale: 5')
    expect(layoutContent).toContain("viewportFit: 'cover'")
  })

  it('5. LiveStreamViewer memiliki tombol interaktif dengan aria-label lengkap & cover poster LCP instant', () => {
    // Tombol interaktif memiliki aria-label
    expect(viewerContent).toContain('aria-label="Bagikan siaran"')
    expect(viewerContent).toContain('aria-label="Tutup siaran"')
    expect(viewerContent).toContain('aria-label="Kirim suka"')
    expect(viewerContent).toContain('aria-label="Lihat produk toko"')
    expect(viewerContent).toContain('aria-label="Tutup daftar produk"')

    // Menampilkan poster cover stream dengan priority untuk LCP instan saat token disiapkan
    expect(viewerContent).toContain('stream.coverImage')
    expect(viewerContent).toContain('priority')
    expect(viewerContent).toContain('Menyambungkan ke siaran...')
  })

  it('6. Asset WebP logo dan caption vtt tersedia dan berukuran teroptimasi', () => {
    const logoWebpPath = path.resolve(process.cwd(), 'public/logo.webp')
    const captionVttPath = path.resolve(
      process.cwd(),
      'public/captions/live-empty.vtt'
    )

    expect(fs.existsSync(logoWebpPath)).toBe(true)
    const logoStats = fs.statSync(logoWebpPath)
    // Logo WebP harus berukuran di bawah 25KB (sebelumnya PNG 117KB)
    expect(logoStats.size).toBeLessThan(25 * 1024)

    expect(fs.existsSync(captionVttPath)).toBe(true)
    const vttContent = fs.readFileSync(captionVttPath, 'utf-8')
    expect(vttContent).toContain('WEBVTT')
  })

  it('7. Helper getGuestViewerToken menangani stream ENDED dengan graceful null', async () => {
    const mockEndedStream: LiveStreamDetail = {
      id: 'mock-ended-1',
      title: 'Mock Live Stream Selesai',
      description: null,
      coverImage: null,
      status: 'ENDED',
      scheduledAt: null,
      startedAt: null,
      endedAt: new Date().toISOString(),
      viewerCount: 0,
      store: null,
    }

    const token = await getGuestViewerToken(mockEndedStream)
    expect(token).toBeNull()
  })
})
