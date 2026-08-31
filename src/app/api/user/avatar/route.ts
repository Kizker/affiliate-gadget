import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import sharp from 'sharp'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary if credentials exist
const isCloudinaryConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
)

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
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
      return NextResponse.json({ error: 'Tidak ada berkas yang dipilih' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Berkas harus berupa gambar (JPG, PNG, atau WebP)' },
        { status: 400 }
      )
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Ukuran foto maksimal 5MB' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Compress and resize image using Sharp (400x400 cover)
    let processedBuffer: Buffer
    try {
      processedBuffer = await sharp(buffer)
        .resize(400, 400, { fit: 'cover', position: 'center' })
        .webp({ quality: 85 })
        .toBuffer()
    } catch {
      processedBuffer = buffer
    }

    let avatarUrl = ''

    // Attempt Cloudinary upload if configured
    if (isCloudinaryConfigured) {
      try {
        const uploadResult = await new Promise<{ secure_url: string }>(
          (resolve, reject) => {
            cloudinary.uploader
              .upload_stream(
                {
                  folder: 'avatars',
                  public_id: `${session.user.id}-${Date.now()}`,
                  resource_type: 'image',
                  transformation: [
                    { width: 400, height: 400, crop: 'fill', gravity: 'face' },
                  ],
                },
                (error, result) => {
                  if (error) reject(error)
                  else resolve(result as { secure_url: string })
                }
              )
              .end(processedBuffer)
          }
        )
        avatarUrl = uploadResult.secure_url
      } catch (cloudErr) {
        console.warn('Cloudinary upload failed, falling back to local storage:', cloudErr)
      }
    }

    // Fallback to local storage if Cloudinary wasn't used or failed
    if (!avatarUrl) {
      const avatarsDir = path.join(process.cwd(), 'public', 'uploads', 'avatars')
      if (!existsSync(avatarsDir)) {
        await mkdir(avatarsDir, { recursive: true })
      }

      const filename = `avatar-${session.user.id}-${Date.now()}.webp`
      const filepath = path.join(avatarsDir, filename)
      await writeFile(filepath, processedBuffer)
      avatarUrl = `/uploads/avatars/${filename}`
    }

    // Update user avatar in database
    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: avatarUrl },
    })

    return NextResponse.json({
      success: true,
      avatarUrl,
    })
  } catch (error) {
    console.error('Error uploading avatar:', error)
    return NextResponse.json(
      { error: 'Gagal memproses upload foto profil.' },
      { status: 500 }
    )
  }
}
