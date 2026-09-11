import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await context.params
    if (!pathSegments || pathSegments.length === 0) {
      return new NextResponse('Not Found', { status: 404 })
    }

    const relativePath = pathSegments.join('/')
    const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads')
    const filePath = path.resolve(uploadsDir, relativePath)

    // Directory traversal security check
    if (!filePath.startsWith(uploadsDir)) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    if (!fs.existsSync(filePath)) {
      return new NextResponse('File Not Found', { status: 404 })
    }

    const stat = fs.statSync(filePath)
    if (!stat.isFile()) {
      return new NextResponse('Not a file', { status: 404 })
    }

    const ext = path.extname(filePath).toLowerCase()
    const contentType = MIME_TYPES[ext] || 'application/octet-stream'

    const buffer = fs.readFileSync(filePath)

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': stat.size.toString(),
        'Cache-Control': 'public, max-age=2592000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (err) {
    console.error('Error serving upload file:', err)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
