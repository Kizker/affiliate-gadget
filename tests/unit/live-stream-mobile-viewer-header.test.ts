import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Live Stream Mobile Top Header UI & Viewer Count', () => {
  const viewerFilePath = path.resolve(
    process.cwd(),
    'src/components/live/live-stream-viewer.tsx'
  )
  const viewerContent = fs.readFileSync(viewerFilePath, 'utf-8')

  it('places viewer count outside of store profile and to its right without eye icon', () => {
    // 1. Eye icon should not be imported
    expect(viewerContent).not.toMatch(
      /import\s*\{[^}]*\bEye\b[^}]*\}\s*from\s*['"]lucide-react['"]/
    )

    // 2. Should calculate displayViewerCount from real-time viewerCount and live status
    expect(viewerContent).toContain(
      'const displayViewerCount = Math.max(viewerCount, isLive ? 1 : 0)'
    )

    // 3. In mobile portrait view, store profile and viewer count must be separate adjacent flex items
    expect(viewerContent).toContain(
      '{/* Sisi Kiri: Profil Toko + Badge Penonton di Luar Profil */}'
    )
    expect(viewerContent).toContain('{/* 1. Pill Profil Toko */}')
    expect(viewerContent).toContain(
      '{/* 2. Badge Jumlah Penonton (Di luar profil, di sebelah kanan) */}'
    )

    // 4. Viewer count badge should display displayViewerCount cleanly without Eye icon
    expect(viewerContent).not.toContain('<Eye')
    expect(viewerContent).toContain('{displayViewerCount}')
  })

  it('does not nest viewer count inside store profile flex-col container', () => {
    // Profil toko tidak boleh lagi mengandung baris kedua bertuliskan 👁 {viewerCount}
    expect(viewerContent).not.toContain('👁 {viewerCount}')
  })
})
