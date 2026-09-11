import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

// -----------------------------------------------------------------------
// Avatar Upload Strategy (Multi-Tier, Production-Safe)
//
// Tier 1: Cloudinary (if env vars configured)
// Tier 2: Local filesystem write to public/uploads/avatars/
// Tier 3: Base64 data URL stored directly in DB (always works, zero deps)
//
// Tier 3 ensures the feature NEVER fails on any hosting environment,
// including VPS without writable public/ dir or mismatched sharp binaries.
// -----------------------------------------------------------------------

const isCloudinaryConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
)

/**
 * Resize + compress image to 400x400 WebP using sharp (if available).
 * Falls back to original buffer if sharp fails (e.g., arch mismatch on VPS).
 */
async function compressImage(
  buffer: Buffer
): Promise<{ buffer: Buffer; mimeType: string }> {
  try {
    // Dynamic import avoids crashing the module if sharp native binary is missing
    const sharp = (await import('sharp')).default
    const compressed = await sharp(buffer)
      .resize(400, 400, { fit: 'cover', position: 'center' })
      .webp({ quality: 82 })
      .toBuffer()
    return { buffer: compressed, mimeType: 'image/webp' }
  } catch {
    // sharp unavailable (arch mismatch etc.) — use original
    return { buffer, mimeType: 'image/jpeg' }
  }
}

/**
 * Tier 1: Upload to Cloudinary
 */
async function uploadToCloudinary(
  buffer: Buffer,
  userId: string
): Promise<string | null> {
  if (!isCloudinaryConfigured) return null
  try {
    const { v2: cloudinary } = await import('cloudinary')
    cloudinary.config({
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    })
    const result = await new Promise<{ secure_url: string }>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: 'avatars',
              public_id: `user-${userId}-${Date.now()}`,
              resource_type: 'image',
              transformation: [
                { width: 400, height: 400, crop: 'fill', gravity: 'face' },
              ],
            },
            (err, res) => {
              if (err || !res) reject(err || new Error('No result'))
              else resolve(res as { secure_url: string })
            }
          )
          .end(buffer)
      }
    )
    return result.secure_url
  } catch (err) {
    console.warn('[avatar] Cloudinary upload failed:', err)
    return null
  }
}

/**
 * Tier 2: Write to local filesystem (public/uploads/avatars/)
 */
async function uploadToLocalFs(
  buffer: Buffer,
  userId: string
): Promise<string | null> {
  try {
    const { writeFile, mkdir } = await import('fs/promises')
    const { existsSync } = await import('fs')
    const path = await import('path')

    const dir = path.join(process.cwd(), 'public', 'uploads', 'avatars')
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true })
    }
    const filename = `avatar-${userId}-${Date.now()}.webp`
    await writeFile(path.join(dir, filename), buffer)
    return `/uploads/avatars/${filename}`
  } catch (err) {
    console.warn('[avatar] Local filesystem write failed:', err)
    return null
  }
}

/**
 * Tier 3: Base64 data URL — stored directly in DB.
 * Works on ALL environments without any storage dependency.
 * Avatar images are small (~30-50KB after resize) so this is safe.
 */
function toDataUrl(buffer: Buffer, mimeType: string): string {
  return `data:${mimeType};base64,${buffer.toString('base64')}`
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('avatar') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'Tidak ada berkas yang dipilih' },
        { status: 400 }
      )
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Berkas harus berupa gambar (JPG, PNG, atau WebP)' },
        { status: 400 }
      )
    }

    // Validate file size (5MB max before processing)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Ukuran foto maksimal 5MB' },
        { status: 400 }
      )
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer())
    const { buffer: processedBuffer, mimeType } = await compressImage(rawBuffer)

    // --- Tier 1: Cloudinary ---
    let avatarUrl = await uploadToCloudinary(processedBuffer, session.user.id)

    // --- Tier 2: Local filesystem ---
    if (!avatarUrl) {
      avatarUrl = await uploadToLocalFs(processedBuffer, session.user.id)
    }

    // --- Tier 3: Base64 data URL (always-works fallback) ---
    if (!avatarUrl) {
      avatarUrl = toDataUrl(processedBuffer, mimeType)
    }

    // Persist avatar URL to database
    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: avatarUrl },
    })

    return NextResponse.json({ success: true, avatarUrl })
  } catch (error) {
    console.error('[avatar] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Gagal memproses upload foto profil. Silakan coba lagi.' },
      { status: 500 }
    )
  }
}
