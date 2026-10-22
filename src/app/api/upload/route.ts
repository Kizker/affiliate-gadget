import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'
import sharp from 'sharp'

// Batas ukuran dan spesifikasi media
const IMAGE_MAX_SIZE = 2 * 1024 * 1024 // 2 MB
const IMAGE_HARD_LIMIT = 25 * 1024 * 1024 // 25 MB
const VIDEO_MAX_SIZE = 30 * 1024 * 1024 // 30 MB

const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png']
const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png']

// POST - Upload file
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file || file.size === 0) {
      return NextResponse.json(
        { error: 'Berkas tidak boleh kosong' },
        { status: 400 }
      )
    }

    const rawExtension = file.name.split('.').pop()?.toLowerCase() || ''
    const isImage =
      file.type.startsWith('image/') ||
      ALLOWED_IMAGE_EXTENSIONS.includes(rawExtension)
    const isVideo = file.type.startsWith('video/') || rawExtension === 'mp4'

    if (!isImage && !isVideo) {
      return NextResponse.json(
        {
          error:
            'Format file tidak didukung. Foto harus JPG, JPEG, atau PNG, dan video harus MP4.',
        },
        { status: 400 }
      )
    }

    let buffer: Buffer
    let finalExtension = rawExtension

    if (isImage) {
      // 1. Validasi Format Foto: JPG, JPEG, atau PNG
      const isExtValid = ALLOWED_IMAGE_EXTENSIONS.includes(rawExtension)
      const isMimeValid =
        ALLOWED_IMAGE_MIMES.includes(file.type) || file.type === 'image/*'

      if (!isExtValid && !isMimeValid) {
        return NextResponse.json(
          {
            error:
              'Format file tidak didukung. Format foto harus JPG, JPEG, atau PNG.',
          },
          { status: 400 }
        )
      }

      // 2. Batas keras ukuran foto sebelum kompresi
      if (file.size > IMAGE_HARD_LIMIT) {
        return NextResponse.json(
          { error: 'Ukuran file terlalu besar. Maksimal 2 MB per foto.' },
          { status: 400 }
        )
      }

      const bytes = await file.arrayBuffer()
      buffer = Buffer.from(bytes)

      // 3. Otomatis kompres jika ukuran file > 2 MB
      if (file.size > IMAGE_MAX_SIZE) {
        try {
          // Tahap 1: Resize dan kompresi JPEG quality 80 (flatten transparansi ke putih)
          const comp1 = await sharp(buffer)
            .rotate()
            .flatten({ background: '#ffffff' })
            .resize({
              width: 2048,
              height: 2048,
              fit: 'inside',
              withoutEnlargement: true,
            })
            .jpeg({ quality: 80, progressive: true })
            .toBuffer()
          buffer = Buffer.from(comp1)

          // Tahap 2: Jika masih > 2MB, kompresi lebih intensif
          if (buffer.length > IMAGE_MAX_SIZE) {
            const comp2 = await sharp(buffer)
              .flatten({ background: '#ffffff' })
              .resize({
                width: 1600,
                height: 1600,
                fit: 'inside',
                withoutEnlargement: true,
              })
              .jpeg({ quality: 65, progressive: true })
              .toBuffer()
            buffer = Buffer.from(comp2)
          }

          finalExtension = 'jpg'

          // Jika masih melebihi 2MB setelah kompresi
          if (buffer.length > IMAGE_MAX_SIZE) {
            return NextResponse.json(
              { error: 'Ukuran file terlalu besar. Maksimal 2 MB per foto.' },
              { status: 400 }
            )
          }
        } catch (compressErr) {
          console.error('Sharp auto-compression error:', compressErr)
          return NextResponse.json(
            { error: 'Ukuran file terlalu besar. Maksimal 2 MB per foto.' },
            { status: 400 }
          )
        }
      }
    } else {
      // Validasi Video: MP4 (tidak mendukung format VP9), Maks 30 MB
      const isVp9OrWebm =
        file.type.toLowerCase().includes('vp9') ||
        file.type.toLowerCase().includes('webm') ||
        rawExtension === 'webm'

      if (rawExtension !== 'mp4' || isVp9OrWebm) {
        return NextResponse.json(
          {
            error: 'Format file harus MP4 (tidak mendukung format VP9).',
          },
          { status: 400 }
        )
      }

      if (file.size > VIDEO_MAX_SIZE) {
        return NextResponse.json(
          {
            error: 'Ukuran file terlalu besar. Maksimal 30 MB.',
          },
          { status: 400 }
        )
      }

      const bytes = await file.arrayBuffer()
      buffer = Buffer.from(bytes)
      finalExtension = 'mp4'
    }

    const folderParam = formData.get('folder') as string | null
    const folderSegment = folderParam
      ? folderParam.split('/').filter(Boolean).pop()
      : null
    const sanitizedFolder = folderSegment
      ? folderSegment.replace(/[^a-zA-Z0-9_-]/g, '_')
      : ''
    const folder = sanitizedFolder || 'reviews'

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', folder)
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 8)
    const filename = `${timestamp}-${randomString}.${finalExtension}`
    const filepath = path.join(uploadsDir, filename)

    // Write file
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
