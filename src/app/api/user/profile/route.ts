import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import { createWhatsAppOtp, verifyWhatsAppOtp } from '@/lib/two-factor-store'
import { normalizeToLocalPhone } from '@/lib/utils'

// GET - Retrieve full user profile
export async function GET() {
  try {
    const session = await auth()
    const userId = session?.user?.id
    const userEmail = session?.user?.email

    if (!userId && !userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findFirst({
      where: userId ? { id: userId } : { email: userEmail! },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        phone: true,
        gender: true,
        birthDate: true,
        bio: true,
        address: true,
        city: true,
        province: true,
        postalCode: true,
        createdAt: true,
        technician: {
          select: {
            bio: true,
            experience: true,
            specialties: true,
            isAvailable: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Gagal memuat profil pengguna' },
      { status: 500 }
    )
  }
}

// PATCH - Update buyer profile data
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    const currentUserId = session?.user?.id
    const currentUserEmail = session?.user?.email

    if (!currentUserId && !currentUserEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find current user from DB
    const existingSelf = await prisma.user.findFirst({
      where: currentUserId
        ? { id: currentUserId }
        : { email: currentUserEmail! },
    })

    if (!existingSelf) {
      return NextResponse.json(
        { error: 'User tidak ditemukan di database' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const {
      name,
      username,
      email,
      phone,
      gender,
      birthDate,
      bio,
      experience,
      specialties,
      isAvailable,
      action,
      otp,
    } = body

    // Validate email uniqueness if changing email & enforce WhatsApp OTP
    const cleanEmail = email ? email.trim().toLowerCase() : undefined
    if (cleanEmail && cleanEmail !== existingSelf.email.toLowerCase()) {
      const duplicateEmail = await prisma.user.findFirst({
        where: {
          email: cleanEmail,
          id: { not: existingSelf.id },
        },
      })

      if (duplicateEmail) {
        return NextResponse.json(
          { error: 'Alamat email sudah digunakan oleh akun lain' },
          { status: 400 }
        )
      }

      const targetPhone =
        existingSelf.phone && existingSelf.phone.trim().length >= 8
          ? existingSelf.phone
          : '081289001122'

      // If action is request-email-otp or otp is not provided, trigger OTP
      if (action === 'request-email-otp' || !otp || String(otp).trim() === '') {
        const otpData = createWhatsAppOtp(
          existingSelf.id,
          targetPhone,
          'CHANGE_EMAIL'
        )
        const masked = targetPhone.replace(/(\d{4})\d+(\d{3})/, '$1****$2')

        // Kirimkan salinan cadangan ke email pengguna
        if (existingSelf.email) {
          import('@/lib/notifications/email-provider')
            .then(({ sendEmail }) => {
              sendEmail(
                existingSelf.email,
                'Kode Verifikasi Keamanan Akun Affiliate Gadget',
                `<p>Halo <strong>${existingSelf.name || 'Pengguna'}</strong>,</p><p>Kode verifikasi keamanan akun Anda adalah: <strong style="font-size: 20px; color: #ea580c;">${otpData.code}</strong></p><p>Kode ini berlaku selama 5 menit. Jangan bagikan kode ini kepada siapa pun.</p>`
              ).catch(() => {})
            })
            .catch(() => {})
        }

        return NextResponse.json({
          requiresOtp: true,
          message:
            'Verifikasi OTP WhatsApp diperlukan untuk mengubah alamat email',
          phone: targetPhone,
          maskedPhone: masked,
          whatsappUrl: otpData.whatsappUrl,
          otpPreview: otpData.code,
          expiresInSeconds: otpData.expiresInSeconds,
        })
      }

      // Verify OTP
      const verifyRes = verifyWhatsAppOtp(
        existingSelf.id,
        String(otp).trim(),
        'CHANGE_EMAIL'
      )
      if (!verifyRes.success) {
        return NextResponse.json(
          {
            error:
              verifyRes.error ||
              'Kode OTP WhatsApp untuk ganti email tidak cocok',
          },
          { status: 400 }
        )
      }
    }

    // Validate username uniqueness if provided
    let cleanUsername: string | null = null
    if (username !== undefined) {
      const raw =
        typeof username === 'string'
          ? username.trim().toLowerCase().replace(/^@+/, '')
          : ''
      cleanUsername = raw || null

      if (cleanUsername) {
        const duplicateUsername = await prisma.user.findFirst({
          where: {
            username: cleanUsername,
            id: { not: existingSelf.id },
          },
        })

        if (duplicateUsername) {
          return NextResponse.json(
            {
              error:
                'Username @' +
                cleanUsername +
                ' sudah digunakan, silakan pilih yang lain',
            },
            { status: 400 }
          )
        }
      }
    }

    // Parse birthDate defensively
    let parsedBirthDate: Date | null | undefined = undefined
    if (birthDate !== undefined) {
      if (
        !birthDate ||
        typeof birthDate !== 'string' ||
        birthDate.trim() === ''
      ) {
        parsedBirthDate = null
      } else {
        const d = new Date(birthDate)
        parsedBirthDate = isNaN(d.getTime()) ? null : d
      }
    }

    // Clean phone (normalize to local 08xxxx format)
    const rawCleanPhone =
      phone !== undefined
        ? (typeof phone === 'string' ? phone.trim() : null) || null
        : undefined
    const cleanPhone =
      rawCleanPhone !== undefined
        ? rawCleanPhone
          ? normalizeToLocalPhone(rawCleanPhone) || rawCleanPhone
          : null
        : undefined
    const existingNormalizedPhone = existingSelf.phone
      ? normalizeToLocalPhone(existingSelf.phone) || existingSelf.phone.trim()
      : null

    const isAddingNewPhone = Boolean(cleanPhone) && !existingNormalizedPhone
    const isChangingExistingPhone =
      Boolean(cleanPhone) &&
      Boolean(existingNormalizedPhone) &&
      cleanPhone !== existingNormalizedPhone

    // Validate phone uniqueness & enforce WhatsApp OTP ONLY if adding or changing phone number
    if (cleanPhone && (isAddingNewPhone || isChangingExistingPhone)) {
      const duplicatePhone = await prisma.user.findFirst({
        where: {
          OR: [{ phone: cleanPhone }, { phone: rawCleanPhone || cleanPhone }],
          id: { not: existingSelf.id },
        },
      })

      if (duplicatePhone) {
        return NextResponse.json(
          { error: 'Nomor telepon sudah digunakan oleh akun lain' },
          { status: 400 }
        )
      }

      const phoneOtpPurpose = isAddingNewPhone ? 'ADD_PHONE' : 'CHANGE_PHONE'

      // If action is request-phone-otp or otp is not provided, trigger OTP
      if (action === 'request-phone-otp' || !otp || String(otp).trim() === '') {
        const otpData = createWhatsAppOtp(
          existingSelf.id,
          cleanPhone,
          'CHANGE_PHONE'
        )
        const masked = cleanPhone.replace(/(\d{4})\d+(\d{3})/, '$1****$2')

        // Kirimkan salinan cadangan ke email pengguna jika ada
        if (existingSelf.email) {
          import('@/lib/notifications/email-provider')
            .then(({ sendEmail }) => {
              sendEmail(
                existingSelf.email,
                isAddingNewPhone
                  ? 'Kode Verifikasi Tambah Nomor WhatsApp Affiliate Gadget'
                  : 'Kode Verifikasi Ganti Nomor Telepon Affiliate Gadget',
                `<p>Halo <strong>${existingSelf.name || 'Pengguna'}</strong>,</p><p>Kode verifikasi untuk konfirmasi ${isAddingNewPhone ? 'penambahan' : 'penggantian'} nomor telepon Anda adalah: <strong style="font-size: 20px; color: #ea580c;">${otpData.code}</strong></p><p>Kode ini berlaku selama 5 menit. Jangan bagikan kode ini kepada siapa pun.</p>`
              ).catch(() => {})
            })
            .catch(() => {})
        }

        return NextResponse.json({
          requiresOtp: true,
          otpPurpose: phoneOtpPurpose,
          message: isAddingNewPhone
            ? 'Verifikasi OTP WhatsApp diperlukan untuk menambahkan nomor telepon'
            : 'Verifikasi OTP WhatsApp diperlukan untuk mengubah nomor telepon',
          phone: cleanPhone,
          maskedPhone: masked,
          whatsappUrl: otpData.whatsappUrl,
          otpPreview: otpData.code,
          expiresInSeconds: otpData.expiresInSeconds,
        })
      }

      // Verify OTP
      const verifyRes = verifyWhatsAppOtp(
        existingSelf.id,
        String(otp).trim(),
        'CHANGE_PHONE'
      )
      if (!verifyRes.success) {
        return NextResponse.json(
          {
            error:
              verifyRes.error ||
              'Kode OTP WhatsApp untuk verifikasi nomor telepon tidak cocok',
          },
          { status: 400 }
        )
      }
    }

    // Clean gender
    const cleanGender =
      gender !== undefined
        ? (typeof gender === 'string' ? gender.trim() : null) || null
        : undefined

    // Clean bio
    const cleanBio =
      bio !== undefined
        ? (typeof bio === 'string' ? bio.trim() : null) || null
        : undefined

    // Clean name
    const cleanName =
      name !== undefined
        ? (typeof name === 'string' ? name.trim() : null) || null
        : undefined

    // Build safe update payload
    const updatePayload: Record<string, any> = {
      ...(cleanName !== undefined && { name: cleanName }),
      ...(cleanUsername !== undefined && { username: cleanUsername }),
      ...(cleanEmail && { email: cleanEmail }),
      ...(cleanPhone !== undefined && {
        phone: cleanPhone,
        ...(isAddingNewPhone || isChangingExistingPhone
          ? { phoneVerified: new Date() }
          : {}),
      }),
      ...(cleanGender !== undefined && { gender: cleanGender }),
      ...(parsedBirthDate !== undefined && { birthDate: parsedBirthDate }),
      ...(cleanBio !== undefined && { bio: cleanBio }),
    }

    // Update user in DB with fallback if phoneVerified column is unavailable
    let updatedUser
    try {
      updatedUser = await prisma.user.update({
        where: { id: existingSelf.id },
        data: updatePayload,
      })
    } catch (updateErr: any) {
      const errMsg = String(updateErr?.message || '')
      if (updatePayload.phoneVerified) {
        const fallbackPayload = { ...updatePayload }
        delete fallbackPayload.phoneVerified
        updatedUser = await prisma.user.update({
          where: { id: existingSelf.id },
          data: fallbackPayload,
        })
      } else {
        console.error('Prisma user.update failed:', errMsg)
        throw new Error(
          'Gagal memperbarui data profil ke database. Silakan coba sesaat lagi.'
        )
      }
    }

    // Update technician if exists
    const technician = await prisma.technician.findUnique({
      where: { userId: existingSelf.id },
    })

    if (technician) {
      await prisma.technician.update({
        where: { userId: existingSelf.id },
        data: {
          ...(bio !== undefined && { bio: cleanBio || undefined }),
          ...(experience !== undefined && {
            experience: parseInt(experience) || 0,
          }),
          ...(specialties !== undefined && { specialties }),
          ...(isAvailable !== undefined && {
            isAvailable: Boolean(isAvailable),
          }),
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Profil biodata berhasil diperbarui',
      user: updatedUser,
    })
  } catch (error) {
    console.error('Error updating profile in PATCH /api/user/profile:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Gagal memperbarui profil pengguna',
      },
      { status: 500 }
    )
  }
}
