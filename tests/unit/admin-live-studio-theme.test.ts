import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Admin Live Studio Theme & Neutral Harmonization Suite', () => {
  const pagePath = path.join(
    process.cwd(),
    'src/app/dashboard/admin/live/page.tsx'
  )
  const broadcasterPath = path.join(
    process.cwd(),
    'src/components/live/live-stream-broadcaster.tsx'
  )

  const pageContent = fs.readFileSync(pagePath, 'utf-8')
  const broadcasterContent = fs.readFileSync(broadcasterPath, 'utf-8')

  it('eliminates redundant double header card in admin live page wrapper', () => {
    // Wrapper page must cleanly delegate full layout to LiveStreamBroadcaster without duplicate header
    expect(pageContent).not.toContain('Siaran Langsung Toko (Live Shopping)')
    expect(pageContent).not.toContain('Halaman Live Publik')
    expect(pageContent).toContain('<LiveStreamBroadcaster />')
  })

  it('removes pitch-black hero banner and neon orange title from idle broadcaster state', () => {
    // No more pitch-black gradient banner and glowing neon orange labels
    expect(broadcasterContent).not.toContain(
      'from-slate-900 via-slate-800 to-slate-900'
    )
    expect(broadcasterContent).not.toContain('text-orange-400')
    expect(broadcasterContent).not.toContain('from-orange-500 to-amber-500')
  })

  it('adopts clean white e-commerce canvas header and slate button matching platform theme', () => {
    // Header card follows dashboard white canvas pattern
    expect(broadcasterContent).toContain(
      'rounded-3xl border border-slate-200/80 bg-white p-6'
    )
    expect(broadcasterContent).toContain('Live Shopping Studio')
    expect(broadcasterContent).toContain('Studio Siaran Langsung Toko')
    expect(broadcasterContent).toContain(
      'bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white'
    )
  })

  it('includes 3-column informative bento stat strip for SFU infrastructure, catalog, and sessions', () => {
    expect(broadcasterContent).toContain('Infrastruktur Siaran')
    expect(broadcasterContent).toContain('LiveKit SFU Cloud')
    expect(broadcasterContent).toContain('Katalog Toko')
    expect(broadcasterContent).toContain('Unit Siap Semat')
    expect(broadcasterContent).toContain('Riwayat Siaran')
    expect(broadcasterContent).toContain('Total Sesi')
  })

  it('transforms dark muddy empty state into clean white dashed card with neutral slate typography', () => {
    // Empty state should be clean dashed white card instead of dark muddy bg-slate-900/50
    expect(broadcasterContent).not.toContain('bg-slate-900/50 py-16')
    expect(broadcasterContent).toContain(
      'rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center'
    )
    expect(broadcasterContent).toContain('Belum Ada Sesi Siaran')
    expect(broadcasterContent).toContain('Buat Sesi Siaran Sekarang')
  })

  it('harmonizes setup modal with clean white theme and neutral product selection pills', () => {
    // Setup form modal must be white canvas with neutral slate accents
    expect(broadcasterContent).not.toContain('bg-slate-900/90 p-6 text-white')
    expect(broadcasterContent).toContain(
      'mx-auto max-w-2xl rounded-3xl border border-slate-200/80 bg-white p-6'
    )
    expect(broadcasterContent).toContain(
      'border border-slate-900 bg-white text-slate-900'
    )
    expect(broadcasterContent).toContain('Mulai On-Air Siaran Sekarang')
  })
})
