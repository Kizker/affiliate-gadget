import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

// POST - Create or get direct chat room with a service partner (Mitra Servis)
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { mitraId, serviceContext } = body

    if (!mitraId || typeof mitraId !== 'string') {
      return NextResponse.json(
        { error: 'Parameter mitraId wajib disertakan.' },
        { status: 400 }
      )
    }

    // 1. Resolve Mitra Servis & Account User
    let mitra = await prisma.mitra.findFirst({
      where: {
        OR: [{ id: mitraId }, { userId: mitraId }],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            isActive: true,
          },
        },
      },
    })

    if (!mitra) {
      // Fallback: check if mitraId is User ID with role MITRA
      const mitraUser = await prisma.user.findFirst({
        where: { id: mitraId, role: 'MITRA' },
        include: { mitra: true },
      })
      if (mitraUser && mitraUser.mitra) {
        mitra = {
          ...mitraUser.mitra,
          user: {
            id: mitraUser.id,
            name: mitraUser.name,
            email: mitraUser.email,
            image: mitraUser.image,
            role: mitraUser.role,
            isActive: mitraUser.isActive,
          },
        }
      }
    }

    if (!mitra || !mitra.user) {
      return NextResponse.json(
        { error: 'Mitra servis tidak ditemukan atau akun belum aktif.' },
        { status: 404 }
      )
    }

    const partnerUserId = mitra.user.id

    // 2. Find or Create Unified Chat Room between this customer & this Mitra Servis
    let room = await prisma.adminChatRoom.findFirst({
      where: {
        customerId: session.user.id,
        claimedById: partnerUserId,
        storeId: null,
      },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        claimedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 60,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                image: true,
                role: true,
              },
            },
          },
        },
      },
    })

    const isNew = !room

    if (!room) {
      room = await prisma.adminChatRoom.create({
        data: {
          customerId: session.user.id,
          claimedById: partnerUserId,
          storeId: null,
          claimedAt: new Date(),
          lastMessageAt: new Date(),
        },
        include: {
          claimedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              role: true,
            },
          },
          messages: {
            orderBy: { createdAt: 'asc' },
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                  role: true,
                },
              },
            },
          },
        },
      })
    }

    return NextResponse.json({
      success: true,
      roomId: room.id,
      isNew,
      store: {
        id: mitra.id,
        name: mitra.businessName,
        companyName: `Mitra Servis: ${mitra.city}`,
        phone: mitra.phone || mitra.whatsapp || '-',
        city: mitra.city,
        logo: mitra.banner || null,
        isActive: mitra.isActive,
        isMitra: true,
      },
      claimedBy: room.claimedBy,
      messages: room.messages || [],
    })
  } catch (error) {
    console.error('[POST /api/customer/chat/mitra-room Error]:', error)
    return NextResponse.json(
      { error: 'Terjadi kendala saat menghubungkan ke chat mitra servis.' },
      { status: 500 }
    )
  }
}
