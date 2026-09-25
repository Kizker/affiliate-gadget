import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const body = await req.json().catch(() => ({}))
    const { currentDeviceId } = body

    const targetUserId = session?.user?.id

    if (!targetUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Hapus semua perangkat lain selain perangkat yang sedang digunakan saat ini
    await db.userDevice.deleteMany({
      where: {
        userId: targetUserId,
        ...(currentDeviceId ? { id: { not: currentDeviceId } } : {}),
      },
    })

    // Invalidate sessions di database (jika Session model digunakan)
    await db.session.deleteMany({
      where: {
        userId: targetUserId,
      },
    })

    return NextResponse.json({
      success: true,
      message:
        'Semua sesi perangkat lain telah berhasil diputus demi keamanan.',
    })
  } catch (error) {
    console.error('[API REVOKE SESSIONS ERROR]:', error)
    return NextResponse.json(
      { error: 'Gagal memutuskan sesi perangkat' },
      { status: 500 }
    )
  }
}
