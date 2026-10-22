import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'
import sharp from 'sharp'

/**
 * POST /api/products/upload-images
 *
 * Upload hingga 5 foto produk ke VPS filesystem (public/uploads/products/).
 * Mendukung upload batch: kirim multiple file sekaligus via multipart/form-data.
 * Field name: "images" (multiple)
 *
 * Return: { success: true, urls: string[] }
 */
export async function POST(request: NextRequest) {
  let session
  try {
    session = await auth()
  } catch {
    return NextResponse.json({ error: 'Sesi tidak valid' }, { status: 401 })
  }

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
  }

  // Only ADMIN & SUPER_ADMIN & STORE_ADMIN can upload product images
  const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'STORE_ADMIN']
  if (!allowedRoles.includes(session.user.role as string)) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json(
      { error: 'Gagal membaca data form' },
      { status: 400 }
    )
  }

  // Get all files (field name: "images")
  const rawFiles = formData.getAll('images')
  const files = rawFiles.filter(
    (f): f is File => f instanceof File && f.size > 0
  )

  if (files.length === 0) {
    return NextResponse.json(
      { error: 'Tidak ada foto yang dipilih' },
      { status: 400 }
    )
  }

  if (files.length > 5) {
    return NextResponse.json(
      { error: 'Maksimal 5 foto produk' },
      { status: 400 }
    )
  }

  // Validate each file (supports images & videos)
  const processedFiles: { buffer: Buffer; filename: string }[] = []
  const IMAGE_MAX_SIZE = 2 * 1024 * 1024 // 2 MB
  const IMAGE_HARD_LIMIT = 25 * 1024 * 1024 // 25 MB
  const VIDEO_MAX_SIZE = 30 * 1024 * 1024 // 30 MB
  const ALLOWED_IMAGE_EXTS = ['jpg', 'jpeg', 'png']

  for (const file of files) {
    const fileExt = file.name.split('.').pop()?.toLowerCase() || ''
    const isImage =
      file.type.startsWith('image/') || ALLOWED_IMAGE_EXTS.includes(fileExt)
    const isVideo = file.type.startsWith('video/') || fileExt === 'mp4'

    if (!isImage && !isVideo) {
      return NextResponse.json(
        {
          error: `File "${file.name}" tidak didukung. Foto harus JPG, JPEG, atau PNG, dan video harus MP4.`,
        },
        { status: 400 }
      )
    }

    if (isImage) {
      if (
        !ALLOWED_IMAGE_EXTS.includes(fileExt) &&
        file.type !== 'image/jpeg' &&
        file.type !== 'image/png'
      ) {
        return NextResponse.json(
          {
            error: `File "${file.name}" bukan format JPG, JPEG, atau PNG yang valid.`,
          },
          { status: 400 }
        )
      }

      if (file.size > IMAGE_HARD_LIMIT) {
        return NextResponse.json(
          {
            error: `Foto "${file.name}" terlalu besar. Maksimal 2 MB per foto.`,
          },
          { status: 400 }
        )
      }

      const bytes = await file.arrayBuffer()
      let buffer = Buffer.from(bytes)

      if (file.size > IMAGE_MAX_SIZE) {
        try {
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

          if (buffer.length > IMAGE_MAX_SIZE) {
            return NextResponse.json(
              {
                error: `Foto "${file.name}" terlalu besar. Maksimal 2 MB per foto.`,
              },
              { status: 400 }
            )
          }
        } catch {
          return NextResponse.json(
            {
              error: `Foto "${file.name}" terlalu besar atau rusak. Maksimal 2 MB per foto.`,
            },
            { status: 400 }
          )
        }
      }

      const timestamp = Date.now()
      const random = Math.random().toString(36).substring(2, 8)
      const filename = `product-${timestamp}-${random}.jpg`
      processedFiles.push({ buffer, filename })
    } else {
      const isVp9OrWebm =
        file.type.toLowerCase().includes('vp9') ||
        file.type.toLowerCase().includes('webm') ||
        fileExt === 'webm'

      if (fileExt !== 'mp4' || isVp9OrWebm) {
        return NextResponse.json(
          {
            error: `Format video "${file.name}" harus MP4 (tidak mendukung format VP9).`,
          },
          { status: 400 }
        )
      }

      if (file.size > VIDEO_MAX_SIZE) {
        return NextResponse.json(
          {
            error: `Video "${file.name}" terlalu besar. Maksimal 30 MB.`,
          },
          { status: 400 }
        )
      }

      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const timestamp = Date.now()
      const random = Math.random().toString(36).substring(2, 8)
      const filename = `product-${timestamp}-${random}.mp4`
      processedFiles.push({ buffer, filename })
    }
  }

  // Ensure uploads/products directory exists
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'products')
  try {
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true, mode: 0o755 })
    }
  } catch (err) {
    console.error('[product-images] mkdir failed:', err)
    return NextResponse.json(
      { error: 'Gagal membuat direktori penyimpanan' },
      { status: 500 }
    )
  }

  const urls: string[] = []

  for (const item of processedFiles) {
    const filepath = path.join(uploadsDir, item.filename)
    try {
      await writeFile(filepath, item.buffer, { mode: 0o644 })
      urls.push(`/uploads/products/${item.filename}`)
    } catch (err) {
      console.error('[product-images] writeFile failed:', err)
      return NextResponse.json(
        { error: `Gagal menyimpan file "${item.filename}"` },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ success: true, urls })
}
