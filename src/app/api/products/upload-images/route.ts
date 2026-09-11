import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

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

  // Validate each file
  for (const file of files) {
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        {
          error: `File "${file.name}" bukan format gambar yang valid (JPG, PNG, WebP)`,
        },
        { status: 400 }
      )
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: `File "${file.name}" terlalu besar (Maksimal 10MB per foto)` },
        { status: 400 }
      )
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

  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/avif': 'avif',
  }

  const urls: string[] = []

  for (const file of files) {
    const ext = mimeToExt[file.type] ?? 'jpg'
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const filename = `product-${timestamp}-${random}.${ext}`
    const filepath = path.join(uploadsDir, filename)

    try {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(filepath, buffer, { mode: 0o644 })
      urls.push(`/uploads/products/${filename}`)
    } catch (err) {
      console.error('[product-images] writeFile failed:', err)
      return NextResponse.json(
        { error: `Gagal menyimpan foto "${file.name}"` },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ success: true, urls })
}
