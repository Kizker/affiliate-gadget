import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
}

// GET - List mass update tasks (documents table)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const role = session?.user?.role

    if (!role || (role !== 'SUPER_ADMIN' && role !== 'STORE_ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: NO_CACHE_HEADERS }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // "DOWNLOAD" | "UPLOAD"

    let userStoreId = session.user.storeId
    if (role === 'STORE_ADMIN' && !userStoreId && session.user.id) {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { storeId: true },
      })
      userStoreId = dbUser?.storeId || null
    }

    const whereClause: any = {}
    if (role === 'STORE_ADMIN' && userStoreId) {
      whereClause.storeId = userStoreId
    }
    if (type && (type === 'DOWNLOAD' || type === 'UPLOAD')) {
      whereClause.type = type
    }

    const tasks = await prisma.massUpdateTask.findMany({
      where: whereClause,
      include: {
        store: {
          select: { id: true, name: true, city: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json(
      {
        success: true,
        data: tasks,
      },
      { headers: NO_CACHE_HEADERS }
    )
  } catch (error: any) {
    console.error('Error fetching mass update tasks:', error)
    return NextResponse.json(
      { error: error?.message || 'Gagal memuat riwayat dokumen update massal' },
      { status: 500, headers: NO_CACHE_HEADERS }
    )
  }
}

// POST - Create a new mass update task record (download request or upload job)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const role = session?.user?.role

    if (!role || (role !== 'SUPER_ADMIN' && role !== 'STORE_ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: NO_CACHE_HEADERS }
      )
    }

    const body = await request.json()
    const {
      type = 'DOWNLOAD',
      templateType = 'SALES_INFO',
      storeId,
      fileName,
      totalCount = 0,
      fileHash,
    } = body

    let targetStoreId = storeId
    if (role === 'STORE_ADMIN') {
      targetStoreId = session.user.storeId
      if (!targetStoreId && session.user.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { storeId: true },
        })
        targetStoreId = dbUser?.storeId || null
      }
    }

    // Check duplicate upload warning
    if (type === 'UPLOAD' && fileHash) {
      const existingUpload = await prisma.massUpdateTask.findFirst({
        where: {
          type: 'UPLOAD',
          fileHash,
          status: 'COMPLETED',
        },
      })
      if (existingUpload) {
        return NextResponse.json(
          {
            warning: 'DUPLICATE_FILE',
            message: `File ini terdeteksi pernah diunggah pada ${new Date(existingUpload.createdAt).toLocaleString('id-ID')}. Anda yakin ingin memproses ulang?`,
            taskId: existingUpload.id,
          },
          { status: 200 }
        )
      }
    }

    const task = await prisma.massUpdateTask.create({
      data: {
        type: type === 'UPLOAD' ? 'UPLOAD' : 'DOWNLOAD',
        templateType,
        storeId: targetStoreId || null,
        userId: session.user.id,
        status: 'PENDING',
        fileName: fileName || `mass_update_${Date.now()}.xlsx`,
        totalCount: parseInt(String(totalCount)) || 0,
        fileHash: fileHash || null,
        snapshotAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      data: task,
    })
  } catch (error: any) {
    console.error('Error creating mass update task:', error)
    return NextResponse.json(
      { error: error?.message || 'Gagal membuat tugas update massal' },
      { status: 500, headers: NO_CACHE_HEADERS }
    )
  }
}
