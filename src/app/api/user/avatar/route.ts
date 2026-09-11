import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

/**
 * POST /api/user/avatar
 *
 * Menyimpan foto profil langsung ke VPS filesystem (public/uploads/avatars/).
 * Tanpa Cloudinary, tanpa sharp — pure Node.js fs, zero external deps.
 *
 * Nginx dikonfigurasi untuk serve /uploads/ langsung dari disk,
 * sehingga file langsung accessible via URL tanpa Next.js route.
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

  let formData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json(
      { error: 'Gagal membaca data form' },
      { status: 400 }
    )
  }

  const file = formData.get('avatar') as File | null

  if (!file || typeof file === 'string') {
    return NextResponse.json(
      { error: 'Tidak ada berkas yang dipilih' },
      { status: 400 }
    )
  }

  // Validasi tipe file
  if (!file.type.startsWith('image/')) {
    return NextResponse.json(
      { error: 'Berkas harus berupa gambar (JPG, PNG, atau WebP)' },
      { status: 400 }
    )
  }

  // Validasi ukuran (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json(
      { error: 'Ukuran foto maksimal 5MB' },
      { status: 400 }
    )
  }

  // Baca file ke buffer
  let buffer: Buffer
  try {
    const bytes = await file.arrayBuffer()
    buffer = Buffer.from(bytes)
  } catch {
    return NextResponse.json({ error: 'Gagal membaca berkas' }, { status: 500 })
  }

  // Tentukan ekstensi dari MIME type
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/avif': 'avif',
  }
  const ext = mimeToExt[file.type] ?? 'jpg'
  const filename = `avatar-${session.user.id}-${Date.now()}.${ext}`

  // Path upload: /var/www/affiliate-gadget/public/uploads/avatars/
  // process.cwd() di production = /var/www/affiliate-gadget
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'avatars')

  try {
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true, mode: 0o755 })
    }
  } catch (mkdirErr) {
    console.error('[avatar] mkdir failed:', mkdirErr)
    return NextResponse.json(
      { error: 'Gagal membuat direktori penyimpanan. Hubungi admin.' },
      { status: 500 }
    )
  }

  const filepath = path.join(uploadsDir, filename)

  try {
    await writeFile(filepath, buffer, { mode: 0o644 })
  } catch (writeErr) {
    console.error('[avatar] writeFile failed:', writeErr)
    return NextResponse.json(
      { error: 'Gagal menyimpan berkas ke server. Hubungi admin.' },
      { status: 500 }
    )
  }

  const avatarUrl = `/uploads/avatars/${filename}`

  // Simpan URL ke database
  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: avatarUrl },
    })
  } catch (dbErr) {
    console.error('[avatar] DB update failed:', dbErr)
    return NextResponse.json(
      { error: 'Foto tersimpan tapi gagal memperbarui profil. Coba lagi.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, avatarUrl })
}
