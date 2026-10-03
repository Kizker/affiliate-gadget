import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

/**
 * GET /api/live-streams/[id]/thumbnail
 * Serves real-time snapshot image of the live stream for WhatsApp, Facebook, Telegram crawlers.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    // 1. Check if snapshot file exists on disk
    const snapshotPath = path.join(
      process.cwd(),
      'public',
      'uploads',
      'live-snapshots',
      `${id}.jpg`
    )

    if (existsSync(snapshotPath)) {
      const buffer = await readFile(snapshotPath)
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'public, max-age=10, stale-while-revalidate=30',
        },
      })
    }

    // 2. Fallback to stream coverImage if configured
    const stream = await prisma.liveStream.findUnique({
      where: { id },
      include: { store: true },
    })

    if (stream?.coverImage) {
      if (stream.coverImage.startsWith('/uploads/')) {
        const coverPath = path.join(process.cwd(), 'public', stream.coverImage)
        if (existsSync(coverPath)) {
          const buffer = await readFile(coverPath)
          return new NextResponse(buffer, {
            headers: {
              'Content-Type': 'image/jpeg',
              'Cache-Control': 'public, max-age=60',
            },
          })
        }
      }
    }

    // 3. Fallback: Dynamic SVG preview with stream title and store name
    const storeName = stream?.store?.name || 'Toko Resmi Affiliate Gadget'
    const title = stream?.title || 'Live Streaming Belanja Gadget'

    const svg = `
      <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#020617"/>
            <stop offset="50%" stop-color="#0f172a"/>
            <stop offset="100%" stop-color="#1e1b4b"/>
          </linearGradient>
          <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#f97316"/>
            <stop offset="100%" stop-color="#ea580c"/>
          </linearGradient>
        </defs>
        <rect width="1200" height="630" fill="url(#bg)"/>
        
        <!-- Live Badge -->
        <rect x="80" y="80" width="140" height="48" rx="24" fill="#dc2626"/>
        <circle cx="110" cy="104" r="7" fill="#ffffff"/>
        <text x="130" y="112" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="22" fill="#ffffff" letter-spacing="2">LIVE</text>

        <!-- Store Name -->
        <text x="240" y="112" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="24" fill="#f97316">${storeName.replace(/&/g, '&amp;')}</text>

        <!-- Stream Title -->
        <text x="80" y="240" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="52" fill="#ffffff" width="1040">
          ${title.slice(0, 60).replace(/&/g, '&amp;')}
        </text>

        <!-- Guarantee Pill -->
        <rect x="80" y="480" width="460" height="56" rx="16" fill="#1e293b" stroke="#334155" stroke-width="2"/>
        <text x="110" y="516" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="20" fill="#38bdf8">🛡️ Garansi 30 Hari Ganti Unit Baru</text>

        <!-- Platform Badge -->
        <text x="80" y="590" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="18" fill="#64748b">Affiliate Gadget • Platform Marketplace Gadget Multi-Toko Indonesia</text>
      </svg>
    `

    return new NextResponse(svg.trim(), {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=120',
      },
    })
  } catch (error) {
    console.error('Error serving live thumbnail:', error)
    return new NextResponse('Error loading thumbnail', { status: 500 })
  }
}
