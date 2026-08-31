import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

// POST - Upload file
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type (Images and Videos ONLY)
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')

    if (!isImage && !isVideo) {
      return NextResponse.json(
        {
          error:
            'Hanya file foto (JPG, PNG, WebP, GIF) dan video (MP4, WebM, MOV) yang diperbolehkan.',
        },
        { status: 400 }
      )
    }

    // Validate file size (max 15MB for images, max 60MB for videos)
    const maxSize = isVideo ? 60 * 1024 * 1024 : 15 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: isVideo
            ? 'Ukuran video terlalu besar (Maksimal 60MB).'
            : 'Ukuran foto terlalu besar (Maksimal 15MB).',
        },
        { status: 400 }
      )
    }

    const folderParam = formData.get('folder') as string | null
    const folder = folderParam && /^[a-zA-Z0-9_-]+$/.test(folderParam) ? folderParam : 'reviews'

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', folder)
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 8)
    const extension = file.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg')
    const filename = `${timestamp}-${randomString}.${extension}`
    const filepath = path.join(uploadsDir, filename)

    // Write file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Return public URL
    const url = `/uploads/${folder}/${filename}`

    return NextResponse.json({
      success: true,
      url,
      filename,
      mediaType: isVideo ? 'video' : 'image',
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
