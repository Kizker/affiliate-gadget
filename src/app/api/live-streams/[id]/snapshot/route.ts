import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

/**
 * POST /api/live-streams/[id]/snapshot
 * Saves real-time screenshot frame of the live stream to public uploads
 * and updates liveStream.coverImage for dynamic WhatsApp/OG previews.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const stream = await prisma.liveStream.findUnique({
      where: { id },
      select: { id: true, status: true },
    })

    if (!stream) {
      return NextResponse.json(
        { success: false, error: 'Live stream tidak ditemukan' },
        { status: 404 }
      )
    }

    const body = await req.json()
    const { imageBase64 } = body

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Data gambar snapshot tidak valid' },
        { status: 400 }
      )
    }

    // Strip data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    // Prepare uploads directory
    const uploadsDir = path.join(
      process.cwd(),
      'public',
      'uploads',
      'live-snapshots'
    )
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true, mode: 0o755 })
    }

    const filename = `${id}.jpg`
    const filePath = path.join(uploadsDir, filename)
    await writeFile(filePath, buffer)

    const coverUrl = `/uploads/live-snapshots/${filename}`

    // Update coverImage in database
    await prisma.liveStream.update({
      where: { id },
      data: {
        coverImage: coverUrl,
      },
    })

    return NextResponse.json({
      success: true,
      url: `${coverUrl}?t=${Date.now()}`,
    })
  } catch (error) {
    console.error('Error saving live snapshot:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal menyimpan snapshot live' },
      { status: 500 }
    )
  }
}
